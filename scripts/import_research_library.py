"""Verify the supplied research archive and publish lossless web data exports."""
import argparse
import csv
import hashlib
import io
import json
import re
import sqlite3
from collections import Counter, defaultdict
from pathlib import Path, PurePosixPath
from zipfile import ZipFile

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('archive',type=Path)
args=parser.parse_args()
prefix='od-toirog-esoteric-library/'
expected={'tarot':78,'term':118,'tradition':24,'symbol':40,'taboo':28,'vocabulary':96,'copy':48,'spread':25,'method':18,'example':6,'translation':37}

def flatten(value):
    if isinstance(value,dict):return ' '.join(flatten(v) for v in value.values())
    if isinstance(value,list):return ' '.join(flatten(v) for v in value)
    return '' if value is None else str(value)

with ZipFile(args.archive) as archive:
    payload={}
    for info in archive.infolist():
        path=PurePosixPath(info.filename)
        if info.is_dir():continue
        if path.is_absolute() or '..' in path.parts or not info.filename.startswith(prefix):
            raise ValueError('Unexpected archive member')
        relative=info.filename[len(prefix):]
        if relative in payload:raise ValueError('Duplicate archive member')
        payload[relative]=archive.read(info)
    manifest={}
    for line in payload['manifest.sha256'].decode().splitlines():
        digest,name=line.split(None,1)
        if hashlib.sha256(payload[name]).hexdigest()!=digest:raise ValueError(f'Checksum mismatch: {name}')
        manifest[name]=digest
    if set(manifest)!=set(payload)-{'manifest.sha256'}:raise ValueError('Incomplete source manifest')
    entries=json.loads(payload['data/catalog.json'])
    sources=json.loads(payload['data/sources.json'])
    meta=json.loads(payload['data/metadata.json'])
    by_id={e['id']:e for e in entries};by_source={s['id']:s for s in sources}
    assert len(entries)==len(by_id)==518
    assert len(sources)==len(by_source)==117
    assert all(re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',ident) for ident in [*by_id,*by_source])
    assert len({s['independent_work_id'] for s in sources})==33
    assert dict(Counter(e['category'] for e in entries))==expected==meta['counts']
    assert all(s['url'].startswith('https://') for s in sources)
    for category in expected:
        assert json.loads(payload[f'data/{category}.json'])==[e for e in entries if e['category']==category]
    assert [json.loads(line) for line in payload['data/catalog.jsonl'].decode().splitlines()]==entries
    rows=list(csv.DictReader(io.StringIO(payload['data/catalog.csv'].decode('utf-8-sig'))))
    assert len(rows)==len(entries)
    for row,entry in zip(rows,entries,strict=True):
        for key,value in entry.items():
            assert (json.loads(row[key]) if isinstance(value,(list,dict)) else row[key])==value
    for entry in entries:
        assert all(ref['source_id'] in by_source and ref['scope'] for ref in entry['source_refs'])
        assert entry['summary'] and entry['details']
        if entry['locale']=='mn-draft':assert entry['product_use']=='review_required'
        if entry['category']=='spread':
            positions=entry['details']['positions']
            assert [p['position'] for p in positions]==list(range(1,entry['details']['card_count']+1))
        if entry['category']=='example':
            assert all(by_id[ident]['category']=='tarot' for ident in entry['details']['card_ids'])
            assert any(e['category']=='spread' and e['title']==entry['details']['spread_title'] for e in entries)
    cards=[e for e in entries if e['category']=='tarot']
    assert sorted(e['details']['number'] for e in cards if e['details']['arcana']=='major')==list(range(22))
    for suit in ['Wands','Cups','Swords','Pentacles']:
        assert sorted(e['details']['number'] for e in cards if e['details']['suit']==suit)==list(range(1,15))
    with sqlite3.connect(':memory:') as db:
        db.deserialize(payload['data/knowledge.sqlite'])
        assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
        assert not db.execute('PRAGMA foreign_key_check').fetchall()
        assert {key:json.loads(value) for key,value in db.execute('SELECT id,payload_json FROM entries')}==by_id
        assert {key:json.loads(value) for key,value in db.execute('SELECT id,payload_json FROM sources')}==by_source

    target=ROOT/'content/research'
    target.mkdir(parents=True,exist_ok=True)
    files=['data/catalog.json','data/sources.json','data/metadata.json','data/entry.schema.json','data/source.schema.json','data/validation.json','docs/research-report.md','docs/integration.md','docs/validation.md','README.md','manifest.sha256']
    for name in files:
        output=target/name
        output.parent.mkdir(parents=True,exist_ok=True)
        if output.exists() and output.read_bytes()!=payload[name]:
            raise ValueError(f'Refusing to overwrite modified source: {name}')
        output.write_bytes(payload[name])
    index={
        'version':meta['version'],
        'entries':[dict(id=e['id'],category=e['category'],title=e['title'],summary=e['summary'],locale=e['locale'],product_use=e['product_use'],evidence_status=e['evidence_status'],search_text=flatten([e['title'],e['summary'],e['details'],e['tags'],e['traditions'],[by_source[r['source_id']]['author'] for r in e['source_refs']]])) for e in entries],
        'sources':[dict(s,search_text=flatten(s)) for s in sources],
    }
    public=ROOT/'public/assets/library'
    public.mkdir(parents=True,exist_ok=True)
    (public/'search-index.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':'))+'\n')
    download=ROOT/'public/downloads'
    download.mkdir(parents=True,exist_ok=True)
    (download/'od-toirog-research-library-v1.zip').write_bytes(args.archive.read_bytes())
    fields=defaultdict(set)
    for e in entries:fields[e['category']].update(e['details'])
    report=dict(archive=args.archive.name,archive_sha256=hashlib.sha256(args.archive.read_bytes()).hexdigest(),manifest_files_verified=len(manifest),entries=len(entries),sources=len(sources),works=33,counts=expected,checks=['manifest','json_subsets','jsonl','csv','sqlite','citations','deck_coverage','spreads','examples','drafts'],detail_fields={k:sorted(v) for k,v in fields.items()})
    (target/'IMPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
