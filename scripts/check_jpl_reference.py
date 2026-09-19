"""Re-run the archived Horizons coordinate comparison without network access."""
from datetime import datetime, UTC
from pathlib import Path
import json
from od_toirog.aspects import separation
from services.astrology import jpl

root=Path(__file__).resolve().parents[1]
fixture=json.loads((root/'vendor/od-toirog-engine/tests/fixtures/horizons.json').read_text())
rows=[]
cache={}
try:
    for record in fixture['records']:
        for expected in record['values']:
            at=expected['at']
            if at not in cache:
                cache[at]={p.body:p for p in jpl._engine().provider.positions(datetime.fromisoformat(at))}
            actual=cache[at][record['body']]
            rows.append(dict(body=record['body'],at=at,
                             longitude_error_arcsec=separation(actual.longitude_deg,expected['longitude_deg'])*3600,
                             latitude_error_arcsec=abs(actual.latitude_deg-expected['latitude_deg'])*3600))
    report=dict(checked_at=datetime.now(UTC).isoformat(),count=len(rows),
                max_longitude_error_arcsec=max(r['longitude_error_arcsec'] for r in rows),
                max_latitude_error_arcsec=max(r['latitude_error_arcsec'] for r in rows),
                tolerance_arcsec=fixture['comparison_tolerance_arcsec'],provenance=jpl.provenance(),comparisons=rows)
    assert report['count']==50
    assert max(report['max_longitude_error_arcsec'],report['max_latitude_error_arcsec'])<report['tolerance_arcsec']
    (root/'docs/JPL_VALIDATION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ('provenance','comparisons')},indent=2))
finally:jpl.close()
