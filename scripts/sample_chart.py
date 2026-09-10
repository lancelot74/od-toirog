"""Public reference chart, not a person's birth data or a mocked calculation."""
from pathlib import Path
import json
from services.astrology.engine import natal

chart=natal(dict(birth_date='2000-01-01',birth_time='12:00',birth_time_known=True,latitude=51.4779,longitude=0,timezone='Etc/UTC'))
target=Path(__file__).resolve().parents[1]/'public/assets/reference-chart.json'
target.write_text(json.dumps(chart,ensure_ascii=False,indent=2))
print('Exported calculated J2000 Greenwich reference chart.')
