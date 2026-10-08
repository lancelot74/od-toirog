"""HTTP-boundary regressions; all credentials and transports are synthetic."""
import httpx
import pytest
from fastapi.testclient import TestClient
from apps.api.main import app

UID = '00000000-0000-0000-0000-000000000010'

@pytest.mark.parametrize(('variable','key','bearer'), [
    ('SUPABASE_SECRET_KEY', 'sb_secret_synthetic', None),
    ('SUPABASE_SERVICE_ROLE_KEY', 'sb_secret_synthetic', None),
    ('SUPABASE_SERVICE_ROLE_KEY', 'legacy.synthetic.jwt', 'Bearer legacy.synthetic.jwt'),
])
def test_service_key_headers_keep_user_verification_separate(monkeypatch, variable, key, bearer):
    monkeypatch.delenv('SUPABASE_SECRET_KEY', raising=False)
    monkeypatch.delenv('SUPABASE_SERVICE_ROLE_KEY', raising=False)
    monkeypatch.setenv(variable, key)
    monkeypatch.setenv('SUPABASE_URL', 'https://example.supabase.co')
    monkeypatch.setenv('SUPABASE_ANON_KEY', 'sb_publishable_synthetic')
    calls = []
    def handle(request):
        calls.append(request)
        if request.url.path == '/auth/v1/user':
            assert request.headers['apikey'] == 'sb_publishable_synthetic'
            assert request.headers['authorization'] == 'Bearer user.synthetic.jwt'
            return httpx.Response(200, json={'id': UID, 'app_metadata': {'role':'admin'}})
        assert request.headers['apikey'] == key
        assert request.headers.get('authorization') == bearer
        if request.url.path == '/auth/v1/admin/users':
            return httpx.Response(200, json={'users':[]})
        return httpx.Response(200, json=[])

    with TestClient(app) as client:
        original = app.state.http
        app.state.http = httpx.AsyncClient(transport=httpx.MockTransport(handle))
        try:
            headers={'Authorization':'Bearer user.synthetic.jwt'}
            assert client.get('/admin/knowledge', headers=headers).status_code == 200
            assert client.get('/admin/records/users', headers=headers).status_code == 200
            assert client.delete('/account', headers=headers).json() == {'deleted':True}
            assert sum(r.url.path == '/auth/v1/user' for r in calls) == 3
        finally:
            client.portal.call(app.state.http.aclose)
            app.state.http = original

def test_invalid_user_token_never_reaches_privileged_api(monkeypatch):
    monkeypatch.setenv('SUPABASE_URL', 'https://example.supabase.co')
    monkeypatch.setenv('SUPABASE_ANON_KEY', 'sb_publishable_synthetic')
    monkeypatch.setenv('SUPABASE_SECRET_KEY', 'sb_secret_synthetic')
    calls=[]
    def handle(request):
        calls.append(request)
        assert request.url.path == '/auth/v1/user'
        return httpx.Response(401, json={})
    with TestClient(app) as client:
        original=app.state.http
        app.state.http=httpx.AsyncClient(transport=httpx.MockTransport(handle))
        try:
            assert client.delete('/account',headers={'Authorization':'Bearer invalid'}).status_code == 401
            assert len(calls)==1
        finally:
            client.portal.call(app.state.http.aclose)
            app.state.http=original

def test_modern_key_takes_precedence_and_missing_configuration_fails_closed(monkeypatch):
    from fastapi import HTTPException
    from apps.api.main import service_headers
    monkeypatch.setenv('SUPABASE_SECRET_KEY','sb_secret_synthetic')
    monkeypatch.setenv('SUPABASE_SERVICE_ROLE_KEY','legacy.synthetic.jwt')
    assert service_headers()=={'apikey':'sb_secret_synthetic'}
    monkeypatch.delenv('SUPABASE_SECRET_KEY')
    monkeypatch.delenv('SUPABASE_SERVICE_ROLE_KEY')
    with pytest.raises(HTTPException) as error:service_headers()
    assert error.value.status_code==503
