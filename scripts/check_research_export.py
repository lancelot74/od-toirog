"""Check every exported research article's visible text and local links."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import hashlib
import json

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'out'
DATA=ROOT/'content/research'
entries=json.loads((DATA/'data/catalog.json').read_text())
sources=json.loads((DATA/'data/sources.json').read_text())
meta=json.loads((DATA/'data/metadata.json').read_text())
entry_ids={e['id'] for e in entries}

class Document(HTMLParser):
    def __init__(self,path):
        super().__init__(convert_charrefs=True)
        self.text=[];self.links=[];self.fields=[];self.hidden=0
        self.feed(path.read_text())
    def handle_starttag(self,tag,attrs):
        values=dict(attrs)
        if tag in ('script','style'):self.hidden+=1
        if tag=='a' and 'href' in values:self.links.append(values['href'])
        if 'data-detail-field' in values:self.fields.append(values['data-detail-field'])
    def handle_endtag(self,tag):
        if tag in ('script','style'):self.hidden-=1
    def handle_data(self,data):
        if not self.hidden:self.text.append(data)
    @property
    def visible(self):return ' '.join(' '.join(self.text).split())

def leaves(value):
    if isinstance(value,dict):
        for item in value.values():yield from leaves(item)
    elif isinstance(value,list):
        for item in value:yield from leaves(item)
    elif isinstance(value,str):yield value

def check_text(value,doc,record):
    if value in entry_ids:
        assert any(f'/library/entries/{value}' in href for href in doc.links),(record,'missing reference',value)
    else:
        assert ' '.join(value.split()) in doc.visible,(record,'missing visible content',value[:100])

assert len(entries)==meta['entry_count']==518
for entry in entries:
    path=OUT/'library/entries'/entry['id']/'index.html'
    assert path.is_file(),f'Missing article: {entry["id"]}. Run pnpm build first.'
    doc=Document(path)
    assert set(doc.fields)==set(entry['details']),(entry['id'],'missing detail section')
    for text in [entry['title'],entry['summary'],*leaves(entry['details']),*entry['traditions'],*entry['tags']]:
        check_text(text,doc,entry['id'])
    for reference in entry['source_refs']:
        check_text(reference['scope'],doc,entry['id'])
        assert any(f'/library/sources/{reference["source_id"]}' in href for href in doc.links)
    if entry['locale']=='mn-draft':assert 'Ноорог' in doc.visible or 'ноорог' in doc.visible
for source in sources:
    path=OUT/'library/sources'/source['id']/'index.html'
    assert path.is_file(),f'Missing source: {source["id"]}'
    doc=Document(path)
    for value in source.values():check_text(value,doc,source['id'])

pages=list((OUT/'library').rglob('*.html'))
checked_links=0
for path in pages:
    for href in Document(path).links:
        url=urlsplit(href)
        if url.scheme or url.netloc or not url.path:continue
        relative=unquote(url.path)
        if relative.startswith('/od-toirog/'):relative=relative[len('/od-toirog'):]
        if not relative.startswith('/'):continue
        target=OUT/relative.lstrip('/')
        if target.is_dir() or relative.endswith('/'):target=target/'index.html'
        elif not target.suffix:target=target/'index.html'
        assert target.is_file(),(str(path.relative_to(OUT)),href,'broken local link')
        checked_links+=1

index=json.loads((ROOT/'public/assets/library/search-index.json').read_text())
assert {e['id'] for e in index['entries']}==entry_ids
assert {s['id'] for s in index['sources']}=={s['id'] for s in sources}
manifest=json.loads((DATA/'IMPORT.json').read_text())
assert hashlib.sha256((ROOT/'public/downloads/od-toirog-research-library-v1.zip').read_bytes()).hexdigest()==manifest['archive_sha256']
print(f'Library verified: {len(entries)} complete entry pages, {len(sources)} complete source pages, {len(pages)} library routes, {checked_links} internal links.')
