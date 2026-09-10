-- Initial editorial draft. It is deliberately NOT approved for production use.
insert into public.interpretations(key,payload,status) values
('planet_1_sign_7', '{"headline":"Сар — Хилэнц","summary":"Энэ байрлалыг зурхайн уламжлалд мэдрэмжээ гүн боловсруулах, итгэлцлийг чухалчлах хандлагатай холбодог. Танд хэр нийцэж байгааг өөрийн туршлагаар эргэцүүлээрэй.","strengths":["гүн мэдрэмж","үнэнч чанар"],"challenges":["мэдрэмжээ нуух","хэт дотогшоо болох"],"relationships":["итгэлцлийг чухалчлах"]}', 'draft')
on conflict(key) do nothing;

-- Explicit privileges in addition to RLS. Anonymous visitors cannot read private tables.
revoke all on public.birth_profiles,public.natal_charts,public.daily_readings,public.compatibility_reports,public.interpretations,public.generation_logs from anon;
grant select,insert,update,delete on public.birth_profiles to authenticated;
grant select on public.natal_charts,public.daily_readings,public.compatibility_reports,public.interpretations to authenticated;
