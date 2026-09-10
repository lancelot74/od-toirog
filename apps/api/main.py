from datetime import date, datetime, timezone
from pathlib import Path
from uuid import UUID
import os
import json
import asyncio
from contextlib import asynccontextmanager
from functools import lru_cache
from dotenv import load_dotenv
import httpx
from fastapi import FastAPI, Depends, HTTPException, Header, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field, model_validator
from timezonefinder import TimezoneFinder
from services.astrology.engine import natal, local_to_utc, transits, synastry, VERSION
from services.interpretation.reading import Knowledge, natal_readings, transit_readings, compatibility_readings
from services.interpretation.generator import OpenAIProvider, synthesize, PROMPT_VERSION, PROMPT
from services.astrology.rules import Rules
from services.telemetry import EVENTS, forward

load_dotenv(Path(__file__).resolve().parents[2]/'.env.local')
load_dotenv(Path(__file__).resolve().parents[2]/'.env')

if os.getenv('SENTRY_DSN'):
    import sentry_sdk
    sentry_sdk.init(dsn=os.environ['SENTRY_DSN'],send_default_pii=False,max_request_body_size='never',traces_sample_rate=0)

@asynccontextmanager
async def lifespan(app):
    async with httpx.AsyncClient(timeout=25) as client:
        app.state.http=client
        yield

app=FastAPI(title='Од Тойрог API',lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=os.getenv('WEB_ORIGINS','http://localhost:3001,http://localhost:3000').split(','),allow_methods=['GET','POST','DELETE'],allow_headers=['Authorization','Content-Type'])

@app.exception_handler(ValueError)
async def bad_value(request,exc):
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=422,content={'detail':str(exc)})

@app.exception_handler(httpx.HTTPError)
async def unavailable(request,exc):
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=503,content={'detail':'Өгөгдлийн үйлчилгээ түр боломжгүй байна. Дахин оролдоно уу.'})

def supabase_url():
    url=os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    if not url: raise HTTPException(503,'Supabase сервер тохируулагдаагүй байна.')
    return url.rstrip('/')

async def user(request:Request,authorization:str=Header(default='')):
    if not authorization.startswith('Bearer '):raise HTTPException(401,'Нэвтрэх шаардлагатай.')
    key=os.getenv('SUPABASE_ANON_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    if not key:raise HTTPException(503,'Supabase түлхүүр тохируулагдаагүй байна.')
    response=await request.app.state.http.get(supabase_url()+'/auth/v1/user',headers={'apikey':key,'Authorization':authorization})
    if response.status_code!=200:raise HTTPException(401,'Нэвтрэх эрх дууссан байна.')
    return response.json()

async def admin(current=Depends(user)):
    if current.get('app_metadata',{}).get('role')!='admin':raise HTTPException(403,'Админ эрх шаардлагатай.')
    return current

async def db(request,path,method='GET',body=None,prefer=None):
    key=os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if not key:raise HTTPException(503,'Backend мэдээллийн сангийн тохиргоо дутуу байна.')
    headers={'apikey':key,'Authorization':f'Bearer {key}'}
    if prefer:headers['Prefer']=prefer
    response=await request.app.state.http.request(method,supabase_url()+'/rest/v1/'+path,headers=headers,json=body)
    response.raise_for_status()
    return response.json() if response.content else None

async def owned(request,profile_id,current):
    rows=await db(request,f"birth_profiles?id=eq.{profile_id}&user_id=eq.{current['id']}&select=*")
    if not rows:raise HTTPException(404,'Мэдээлэл олдсонгүй.')
    return rows[0]

async def knowledge(request):
    rows=await db(request,'interpretations?status=eq.approved&select=*')
    return {r['key']:r for r in rows}

async def config(request,key,defaults):
    rows=await db(request,f'runtime_config?key=eq.{key}&select=*')
    return rows[0] if rows else {'key':key,'version':1,'payload':defaults}

async def astrology_rules(request):
    settings=await config(request,'astrology',Rules().model_dump())
    return Rules.model_validate(dict(settings['payload'],version=settings['version']))

class Place(BaseModel):
    name:str=Field(min_length=1,max_length=150)
    country:str=Field(min_length=1,max_length=100)
    latitude:float=Field(ge=-90,le=90)
    longitude:float=Field(ge=-180,le=180)
    timezone:str=''

class Birth(BaseModel):
    id:UUID|None=None
    name:str=Field(min_length=1,max_length=120)
    birth_date:date
    birth_time:str|None=None
    birth_time_known:bool
    place:Place
    time_fold:int=Field(default=0,ge=0,le=1)
    @model_validator(mode='after')
    def valid(self):
        self.name=self.name.strip()
        if not self.name:raise ValueError('Нэрээ оруулна уу.')
        if not date(1900,1,1)<=self.birth_date<=date.today():raise ValueError('Төрсөн огноо 1900 оноос өнөөдрийн хооронд байна.')
        if self.birth_time_known != bool(self.birth_time):raise ValueError('Төрсөн цагийн мэдээлэл зөрүүтэй байна.')
        return self

@lru_cache(maxsize=1)
def finder():return TimezoneFinder(in_memory=True)

@app.get('/health')
def health():return {'status':'ok','calculation_version':VERSION}

@app.get('/locations')
async def locations(request:Request,q:str=Query(min_length=2,max_length=100),current=Depends(user)):
    aliases={'улаанбаатар':'Ulaanbaatar','дархан':'Darkhan','эрдэнэт':'Erdenet','ховд':'Khovd','чойбалсан':'Choibalsan','өлгий':'Olgii'}
    response=await request.app.state.http.get('https://geocoding-api.open-meteo.com/v1/search',params={'name':aliases.get(q.lower().strip(),q),'count':10,'language':'en'})
    response.raise_for_status()
    return [dict(name=r['name'],country=r.get('country',''),latitude=r['latitude'],longitude=r['longitude'],timezone=r.get('timezone','')) for r in response.json().get('results',[])]

@app.post('/profiles')
async def save_profile(body:Birth,request:Request,current=Depends(user)):
    from datetime import time
    zone=await run_in_threadpool(lambda:finder().timezone_at(lng=body.place.longitude,lat=body.place.latitude))
    if not zone:raise HTTPException(422,'Цагийн бүс тодорхойлох боломжгүй байна.')
    clock=time.fromisoformat(body.birth_time) if body.birth_time_known else None
    utc=local_to_utc(body.birth_date,clock,zone,body.time_fold)
    values=dict(user_id=current['id'],name=body.name.strip(),birth_date=str(body.birth_date),birth_time=body.birth_time,birth_time_known=body.birth_time_known,
                birth_city=body.place.name,birth_country=body.place.country,latitude=body.place.latitude,longitude=body.place.longitude,timezone=zone,
                utc_birth_datetime=utc.isoformat(),time_fold=body.time_fold)
    if body.id:
        await owned(request,body.id,current)
        rows=await db(request,f"birth_profiles?id=eq.{body.id}&user_id=eq.{current['id']}",'PATCH',values,'return=representation')
        await db(request,f'natal_charts?profile_id=eq.{body.id}','DELETE')
    else:
        existing=await db(request,f"birth_profiles?user_id=eq.{current['id']}&select=id&limit=1")
        values['is_primary']=not existing
        rows=await db(request,'birth_profiles','POST',values,'return=representation')
    return rows[0]

async def calculate(request,p):
    chart=await run_in_threadpool(natal,p,await astrology_rules(request))
    chart['readings']=natal_readings(chart,await knowledge(request))
    await db(request,'natal_charts?on_conflict=profile_id','POST',dict(profile_id=p['id'],user_id=p['user_id'],chart_json=chart,profile_version=p['updated_at'],calculation_version=VERSION),'resolution=merge-duplicates')
    return chart

@app.get('/charts/{profile_id}')
async def chart(profile_id:UUID,request:Request,current=Depends(user)):
    return await calculate(request,await owned(request,profile_id,current))

@app.get('/today/{profile_id}')
async def today(profile_id:UUID,request:Request,current=Depends(user)):
    async with daily_lock(str(profile_id)):
        return await build_today(profile_id,request,current)

@lru_cache(maxsize=4096)
def daily_lock(profile_id):
    return asyncio.Lock()

async def build_today(profile_id,request,current):
    p=await owned(request,profile_id,current)
    day=datetime.now(timezone.utc).date()
    cached=await db(request,f"daily_readings?profile_id=eq.{profile_id}&date=eq.{day}&select=*")
    for row in cached:
        if row['profile_version']==p['updated_at']:return row['reading_json']
    chart=await calculate(request,p)
    links=await run_in_threadpool(transits,chart,day,await astrology_rules(request))
    entries=await knowledge(request)
    readings=transit_readings(links,entries)
    area_ids={'Хайр':{3,4},'Ажил':{0,6},'Сэтгэл':{1},'Харилцаа':{2}}
    result=dict(date=str(day),chart=chart,transits=links,readings=readings,areas={label:[r for a,r in zip(links,readings) if a['b'] in ids][:2] for label,ids in area_ids.items()},model_version='editorial-deterministic-v1',prompt_version='none',knowledge_version=','.join(f"{k}:{v['version']}" for k,v in sorted(entries.items())) or 'facts-only')
    if os.getenv('OPENAI_API_KEY') and any(r['status']=='approved' for r in readings):
        try:
            language=await config(request,'language',{'prompt':PROMPT,'model':os.getenv('OPENAI_MODEL','gpt-4.1-mini')})
            result['synthesis']=await synthesize(OpenAIProvider(request.app.state.http,language['payload']['prompt'],language['payload']['model']),readings[:8])
            result['model_version']=language['payload']['model']
            result['prompt_version']=f"{PROMPT_VERSION}:{language['version']}"
        except (ValueError, httpx.HTTPError, KeyError, IndexError):
            # Keep deterministic facts on provider failure; never blank the page.
            await db(request,'generation_logs','POST',dict(user_id=current['id'],event='generation_failed',details={'prompt_version':PROMPT_VERSION}))
    await db(request,'daily_readings?on_conflict=profile_id,date,profile_version','POST',dict(user_id=current['id'],profile_id=str(profile_id),date=str(day),profile_version=p['updated_at'],reading_json=result,model_version=result['model_version'],prompt_version=result['prompt_version'],knowledge_version=result['knowledge_version']),'resolution=ignore-duplicates')
    return result

class Pair(BaseModel):
    first:UUID
    second:UUID

@app.post('/compatibility')
async def compatibility(pair:Pair,request:Request,current=Depends(user)):
    if pair.first==pair.second:raise HTTPException(422,'Өөр хоёр профайл сонгоно уу.')
    a=await owned(request,pair.first,current);b=await owned(request,pair.second,current)
    first_chart=await calculate(request,a);second_chart=await calculate(request,b)
    result=synastry(first_chart,second_chart,await astrology_rules(request))
    result.update(first_name=a['name'],second_name=b['name'],first_chart=first_chart,second_chart=second_chart)
    result['readings']=compatibility_readings(result['aspects'],await knowledge(request))
    await db(request,'compatibility_reports','POST',dict(user_id=current['id'],first_profile=str(pair.first),second_profile=str(pair.second),report_json=result))
    return result

@app.get('/account/export')
async def export(request:Request,current=Depends(user)):
    result={}
    for table in ['birth_profiles','natal_charts','daily_readings','compatibility_reports','generation_logs','subscriptions']:
        result[table]=[]
        while True:
            rows=await db(request,f"{table}?user_id=eq.{current['id']}&select=*&order=created_at&limit=500&offset={len(result[table])}")
            result[table].extend(rows)
            if len(rows)<500:break
    return result

@app.delete('/account')
async def delete(request:Request,current=Depends(user)):
    key=os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if not key:raise HTTPException(503,'Backend тохируулагдаагүй байна.')
    response=await request.app.state.http.delete(supabase_url()+f"/auth/v1/admin/users/{current['id']}",headers={'apikey':key,'Authorization':f'Bearer {key}'})
    response.raise_for_status()
    return {'deleted':True}

class Entry(BaseModel):
    key:str=Field(pattern=r'^[a-z0-9_]{1,100}$')
    payload:Knowledge
    status:str=Field(pattern=r'^(draft|review|approved|archived)$')

@app.get('/admin/knowledge')
async def get_knowledge(request:Request,current=Depends(admin)):
    return await db(request,'interpretations?select=*&order=key')

@app.post('/admin/knowledge')
async def put_knowledge(body:Entry,request:Request,current=Depends(admin)):
    rows=await db(request,f'interpretations?key=eq.{body.key}&select=version')
    values=body.model_dump();values['version']=(rows[0]['version'] if rows else 0)+1;values['updated_at']=datetime.now(timezone.utc).isoformat()
    await db(request,'interpretations?on_conflict=key','POST',values,'resolution=merge-duplicates')
    await db(request,'generation_logs','POST',dict(user_id=current['id'],event='knowledge_updated',details={'key':body.key,'version':values['version']}))
    return values

@app.get('/admin/logs')
async def logs(request:Request,current=Depends(admin)):
    return await db(request,'generation_logs?select=*&order=created_at.desc&limit=100')

class Event(BaseModel):
    event:str

@app.post('/events')
async def event(body:Event,request:Request,current=Depends(user)):
    if body.event not in EVENTS:raise HTTPException(422,'Unknown event')
    await db(request,'generation_logs','POST',dict(user_id=current['id'],event=body.event))
    try:await forward(request.app.state.http,body.event,current['id'])
    except httpx.HTTPError:pass
    return {'recorded':True}

class LanguageSettings(BaseModel):
    prompt:str=Field(min_length=50,max_length=15000)
    model:str=Field(pattern=r'^[a-zA-Z0-9._:-]{1,100}$')

class Settings(BaseModel):
    key:str=Field(pattern=r'^(astrology|language)$')
    payload:dict

@app.get('/admin/settings')
async def settings(request:Request,current=Depends(admin)):
    return [await config(request,'astrology',Rules().model_dump()),await config(request,'language',{'prompt':PROMPT,'model':os.getenv('OPENAI_MODEL','gpt-4.1-mini')})]

@app.post('/admin/settings')
async def save_settings(body:Settings,request:Request,current=Depends(admin)):
    payload=(Rules if body.key=='astrology' else LanguageSettings).model_validate(body.payload).model_dump()
    return await db(request,'runtime_config?on_conflict=key','POST',{'key':body.key,'payload':payload,'updated_at':datetime.now(timezone.utc).isoformat()},'resolution=merge-duplicates,return=representation')

@app.get('/admin/records/{kind}')
async def records(kind:str,request:Request,current=Depends(admin)):
    tables={'readings':'daily_readings','knowledge_versions':'knowledge_versions','prompt_versions':'prompt_versions','analytics':'generation_logs','subscriptions':'subscriptions','reports':'compatibility_reports'}
    if kind=='users':
        key=os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        if not key:raise HTTPException(503,'Backend тохируулагдаагүй байна.')
        response=await request.app.state.http.get(supabase_url()+'/auth/v1/admin/users?per_page=50',headers={'apikey':key,'Authorization':f'Bearer {key}'})
        response.raise_for_status()
        return [{k:u.get(k) for k in ('id','email','created_at','last_sign_in_at')} for u in response.json().get('users',[])]
    if kind=='failures':return await db(request,'generation_logs?event=eq.generation_failed&order=created_at.desc&limit=100')
    if kind not in tables:raise HTTPException(404,'Not found')
    return await db(request,f'{tables[kind]}?select=*&order=created_at.desc&limit=100')
