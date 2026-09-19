"""Publish an explicitly fictional reference chart for the method guide."""
import json
from pathlib import Path
from services.astrology import jpl

try:
    result=jpl.natal(dict(birth_date='2000-01-01',birth_time='12:00:00',birth_time_known=True,
                          timezone='Etc/UTC',latitude=51.4779,longitude=0,time_fold_confirmed=False))
    target=Path(__file__).resolve().parents[1]/'public/assets/jpl-reference-chart.json'
    target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print('Generated real JPL chart for 2000-01-01 12:00 UTC, Greenwich reference.')
finally:
    jpl.close()
