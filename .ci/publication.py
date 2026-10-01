"""Review the actual standalone public files; public/ is optional in this app."""
import json
from pathlib import Path
from check_publication import public_entries, report

root = Path('.next/standalone')
out = Path('artifacts'); out.mkdir(exist_ok=True)
reports = {}
reports['static'] = report(public_entries(root / '.next/static', [], None, True), public=True)
public = root / 'public'
if public.exists():
    reports['public'] = report(public_entries(public, [], None, True), public=True)
else:
    reports['public'] = {'status': 'not_applicable', 'reason': 'No public/ directory in this standalone artifact',
                         'files_checked': 0, 'bytes_checked': 0, 'files': [], 'findings': []}
app = root / '.next/server/app'
paths = sorted(p.relative_to(app).as_posix() for p in app.rglob('*.html'))
paths += [n for n in ['robots.txt.body', 'sitemap.xml.body'] if (app / n).is_file()]
entries = public_entries(app, paths, None, False)
for entry in entries:
    entry['path'] = entry['path'].removesuffix('.body')
reports['pages'] = report(entries, public=True)
for name, value in reports.items():
    (out / ('publication-' + name + '.json')).write_text(json.dumps(value, indent=2) + '\n')
    print(name, value['status'], value['files_checked'], 'files')
if any(r['status'] in ['blocked', 'error', 'empty'] for r in reports.values()):
    raise SystemExit('Publication check failed; review artifact reports')
