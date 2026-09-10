import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('PostgreSQL policies isolate two owners and deletion cascades',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth,public to authenticated,anon;
      grant execute on function auth.uid() to authenticated;
      insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
    `);
    for(const file of ['001_foundation.sql','002_knowledge_seed.sql','003_admin_history.sql'])await db.exec(await readFile(new URL(`../supabase/migrations/${file}`,import.meta.url),'utf8'));
    await db.exec(`insert into public.birth_profiles(user_id,name,birth_date,birth_time,birth_time_known,birth_city,birth_country,latitude,longitude,timezone,utc_birth_datetime)
      values ('00000000-0000-0000-0000-000000000001','First','2000-01-01','12:00',true,'Ulaanbaatar','Mongolia',47,106,'Asia/Ulaanbaatar','2000-01-01T04:00:00Z'),
      ('00000000-0000-0000-0000-000000000002','Second','2000-01-01','12:00',true,'Ulaanbaatar','Mongolia',47,106,'Asia/Ulaanbaatar','2000-01-01T04:00:00Z');
      set role authenticated;
      select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);`);
    assert.deepEqual((await db.query('select name from public.birth_profiles')).rows,[{name:'First'}]);
    assert.equal((await db.query("update public.birth_profiles set name='Hijacked' where name='Second' returning id")).rows.length,0);
    await assert.rejects(db.exec("insert into public.natal_charts select id,user_id,'{}',now(),'v1',now() from public.birth_profiles"));
    assert.equal((await db.query('select * from public.interpretations')).rows.length,0);
    await db.exec("select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false)");
    assert.deepEqual((await db.query('select name from public.birth_profiles')).rows,[{name:'Second'}]);
    await db.exec('set role anon');
    await assert.rejects(db.query('select * from public.birth_profiles'));
    await db.exec(`reset role;
      insert into public.natal_charts select id,user_id,'{}',now(),'v1',now() from public.birth_profiles;
      delete from auth.users where id='00000000-0000-0000-0000-000000000001';`);
    assert.equal((await db.query('select * from public.natal_charts')).rows.length,1);
    assert.deepEqual((await db.query('select name from public.birth_profiles')).rows,[{name:'Second'}]);
    await db.exec(`insert into public.interpretations(key,payload,status) values('planet_1_sign_7','{"headline":"Updated"}','review') on conflict(key) do update set payload=excluded.payload,status=excluded.status;
      insert into public.runtime_config(key,payload) values('astrology','{}') on conflict(key) do update set payload=excluded.payload;
      insert into public.runtime_config(key,payload) values('astrology','{"transit_orb":1}') on conflict(key) do update set payload=excluded.payload;`);
    assert.equal((await db.query('select * from public.knowledge_versions')).rows.length,2);
    assert.equal((await db.query('select version from public.runtime_config')).rows[0].version,2);
    assert.equal((await db.query('select * from public.prompt_versions')).rows.length,2);
  }finally{await db.close();}
});
