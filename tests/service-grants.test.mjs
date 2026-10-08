import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

for(const atomic of [false,true])test('backend grants and triggers: '+(atomic?'atomic baseline':'incremental hardening'), async()=>{
  const db=new PGlite();
  const uid='00000000-0000-0000-0000-000000000001';
  try{
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated;
      grant execute on function auth.uid() to authenticated;
      insert into auth.users values ('${uid}');
    `);
    const originals=[];
    for(const file of ['001_foundation.sql','002_knowledge_seed.sql','003_admin_history.sql','004_calculation_methods.sql'])
      originals.push(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
    const hardening=await readFile(new URL('../docs/backend_service_grants.sql',import.meta.url),'utf8');
    const version=Number((await db.query('show server_version_num')).rows[0].server_version_num);
    console.log('PostgreSQL version:',version,'atomic:',atomic);
    await db.exec('alter default privileges in schema public grant truncate,references,trigger on tables to anon,authenticated,service_role');
    if(version>=170000)await db.exec('alter default privileges in schema public grant maintain on tables to anon,authenticated,service_role');
    if(atomic){
      const body=originals.join('\n')+'\n'+hardening;
      assert.equal(body.includes('$od_toirog_baseline$'),false);
      await db.exec('DO $od_toirog_baseline$ BEGIN\n'+body+'\nEND $od_toirog_baseline$;');
    }else{
      for(const original of originals)await db.exec(original);
      await db.exec('set role service_role');
      await assert.rejects(db.query('select * from public.birth_profiles'));
      await db.exec('reset role');
      await db.exec(hardening);
    }
    const tables={
      birth_profiles:['SELECT','INSERT','UPDATE'],
      natal_charts:['SELECT','INSERT','UPDATE','DELETE'],
      daily_readings:['SELECT','INSERT'],
      compatibility_reports:['SELECT','INSERT'],
      generation_logs:['SELECT','INSERT'],
      interpretations:['SELECT','INSERT','UPDATE'],
      runtime_config:['SELECT','INSERT','UPDATE'],
      knowledge_versions:['SELECT','INSERT'],
      prompt_versions:['SELECT','INSERT'],
      subscriptions:['SELECT'],
    };
    for(const [table,allowed] of Object.entries(tables)){
      for(const role of ['service_role','authenticated','anon']){
        const expected=role==='service_role'?allowed:role==='anon'?[]:
          table==='birth_profiles'?['SELECT','INSERT','UPDATE','DELETE']:
          ['natal_charts','daily_readings','compatibility_reports','interpretations','subscriptions'].includes(table)?['SELECT']:[];
        for(const privilege of ['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER',...(version>=170000?['MAINTAIN']:[])]){
          const {rows}=await db.query('select has_table_privilege($1,$2,$3) as permitted',[role,'public.'+table,privilege]);
          assert.equal(rows[0].permitted,expected.includes(privilege),role+' '+table+' '+privilege);
        }
      }
    }
    assert.equal((await db.query("select count(*)::int as n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity")).rows[0].n,10);
    for(const fn of ['touch_birth_profile','version_knowledge','record_knowledge','version_config','record_config']){
      for(const role of ['anon','authenticated','service_role'])
        assert.equal((await db.query('select has_function_privilege($1,$2,$3) as permitted',[role,'public.'+fn+'()','EXECUTE'])).rows[0].permitted,false);
    }
    await db.exec(`
      set role service_role;
      insert into public.birth_profiles(user_id,name,birth_date,birth_time_known,birth_city,birth_country,latitude,longitude,timezone,utc_birth_datetime)
        values ('${uid}','Synthetic','2000-01-01',false,'Synthetic','MN',47,106,'Asia/Ulaanbaatar','2000-01-01T04:00:00Z');
      update public.birth_profiles set name='Updated';
      insert into public.natal_charts(profile_id,user_id,chart_json,profile_version,calculation_version)
        select id,user_id,'{}',updated_at,'test' from public.birth_profiles;
      update public.natal_charts set chart_json='{"checked":true}';
      insert into public.daily_readings(user_id,profile_id,date,profile_version,reading_json,model_version,prompt_version,knowledge_version)
        select user_id,id,'2026-10-01',updated_at,'{}','test','test','test' from public.birth_profiles;
      insert into public.compatibility_reports(user_id,first_profile,second_profile,report_json)
        select user_id,id,id,'{}' from public.birth_profiles;
      insert into public.generation_logs(user_id,event) values ('${uid}','test');
      insert into public.interpretations(key,payload,status) values ('test','{}','draft');
      update public.interpretations set status='approved' where key='test';
      insert into public.runtime_config(key,payload) values ('language','{}');
      update public.runtime_config set payload='{"checked":true}' where key='language';
      delete from public.natal_charts;
    `);
    assert.equal((await db.query("select count(*)::int n from public.knowledge_versions where key='test'")).rows[0].n,2);
    assert.equal((await db.query('select count(*)::int n from public.prompt_versions')).rows[0].n,2);
    await assert.rejects(db.exec('delete from public.birth_profiles'));
    await assert.rejects(db.exec("update public.knowledge_versions set status='draft'"));
    // Authenticated profile updates still invoke the trigger after EXECUTE revocation.
    await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false);
      update public.birth_profiles set name='Owner update';`);
    assert.equal((await db.query('select name from public.birth_profiles')).rows[0].name,'Owner update');
    await db.exec(`reset role; delete from auth.users where id='${uid}';`);
    assert.equal((await db.query('select count(*)::int n from public.daily_readings')).rows[0].n,0);
  }finally{await db.close();}
});
