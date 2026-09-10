"""Optional, replaceable language provider. Astronomy never enters this module."""
import os
import json
from typing import Protocol
from pydantic import BaseModel, Field, ConfigDict

PROMPT_VERSION='daily-mn-v1'
PROMPT='''Write a restrained Mongolian daily reflection using ONLY the approved knowledge and facts supplied.
Astrology is symbolic reflection, not scientifically proven personality or event prediction.
Do not infer life events, illnesses, pregnancy, death, crime, disasters, financial or legal outcomes.
Never add or alter a planetary position, sign, aspect, or degree. Do not mention uncertain birth-time placements.
No HTML. No motivational clichés. Be concise. Return JSON with headline, summary, love, work, emotion,
communication, do, avoid, and evidence_keys. Use an empty string/list when evidence is absent.
evidence_keys must list the exact approved entry keys supporting the response.'''

class DailyText(BaseModel):
    model_config=ConfigDict(extra='forbid',populate_by_name=True)
    headline:str=Field(min_length=1,max_length=200)
    summary:str=Field(min_length=1,max_length=1800)
    love:str=Field(max_length=800)
    work:str=Field(max_length=800)
    emotion:str=Field(max_length=800)
    communication:str=Field(max_length=800)
    do:list[str]=Field(max_length=5)
    avoid:list[str]=Field(max_length=5)
    evidence_keys:list[str]=Field(min_length=1,max_length=20)

class Provider(Protocol):
    async def generate(self, approved:list[dict])->str: ...

class OpenAIProvider:
    def __init__(self,http,prompt=PROMPT,model=None):self.http=http;self.prompt=prompt;self.model=model or os.getenv('OPENAI_MODEL','gpt-4.1-mini')
    async def generate(self,approved):
        response=await self.http.post('https://api.openai.com/v1/chat/completions',headers={'Authorization':f"Bearer {os.environ['OPENAI_API_KEY']}"},json={
            'model':self.model, 'response_format':{'type':'json_object'},
            'messages':[{'role':'system','content':self.prompt},{'role':'user','content':json.dumps(approved,ensure_ascii=False)}],
            'max_tokens':1800,
        })
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']

async def synthesize(provider:Provider,readings:list[dict]):
    approved=[r for r in readings if r['status']=='approved']
    if not approved:return None
    result=DailyText.model_validate_json(await provider.generate(approved))
    keys={r['key'] for r in approved}
    if not set(result.evidence_keys)<=keys:raise ValueError('Unknown knowledge reference')
    return result.model_dump()
