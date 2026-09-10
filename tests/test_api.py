import httpx
from fastapi.testclient import TestClient
from apps.api.main import app, user

def test_no_token_cannot_read_or_delete():
    with TestClient(app) as client:
        assert client.get('/charts/00000000-0000-0000-0000-000000000001').status_code==401
        assert client.delete('/account').status_code==401
        assert client.get('/admin/knowledge').status_code==401

def test_no_admin_privilege_cannot_edit():
    app.dependency_overrides[user]=lambda:{'id':'a','app_metadata':{}}
    try:
        with TestClient(app) as client:
            assert client.get('/admin/knowledge').status_code==403
    finally:app.dependency_overrides.clear()

def test_owned_profile_checks_user_filter(monkeypatch):
    monkeypatch.setenv('SUPABASE_URL','https://example.supabase.co')
    monkeypatch.setenv('SUPABASE_SERVICE_ROLE_KEY','test-only')
    app.dependency_overrides[user]=lambda:{'id':'00000000-0000-0000-0000-000000000002'}
    requests=[]
    def handle(request):
        requests.append(request)
        return httpx.Response(200,json=[])
    try:
        with TestClient(app) as client:
            original=app.state.http
            app.state.http=httpx.AsyncClient(transport=httpx.MockTransport(handle))
            assert client.get('/charts/00000000-0000-0000-0000-000000000001').status_code==404
            assert requests[0].url.params['user_id']=='eq.00000000-0000-0000-0000-000000000002'
            client.portal.call(app.state.http.aclose)
            app.state.http=original
    finally:app.dependency_overrides.clear()

def test_invalid_profile_fails_validation():
    app.dependency_overrides[user]=lambda:{'id':'a'}
    try:
        with TestClient(app) as client:
            r=client.post('/profiles',json={'name':'x','birth_date':'2099-01-01','birth_time_known':False,'place':{'name':'x','country':'MN','latitude':48,'longitude':107}})
            assert r.status_code==422
    finally:app.dependency_overrides.clear()

def test_deletion_targets_only_authenticated_account(monkeypatch):
    monkeypatch.setenv('SUPABASE_URL','https://example.supabase.co')
    monkeypatch.setenv('SUPABASE_SERVICE_ROLE_KEY','test-only')
    uid='00000000-0000-0000-0000-000000000010'
    app.dependency_overrides[user]=lambda:{'id':uid}
    calls=[]
    def handle(request):
        calls.append(request)
        return httpx.Response(200,json={})
    try:
        with TestClient(app) as client:
            original=app.state.http
            app.state.http=httpx.AsyncClient(transport=httpx.MockTransport(handle))
            assert client.delete('/account').json()=={'deleted':True}
            assert calls[0].method=='DELETE'
            assert str(calls[0].url)==f'https://example.supabase.co/auth/v1/admin/users/{uid}'
            client.portal.call(app.state.http.aclose)
            app.state.http=original
    finally:app.dependency_overrides.clear()
