#!/usr/bin/env python3
"""Pass only release identity and the short-lived job token to the SSH receiver."""
import json
import os
from pathlib import Path
import subprocess

result = Path('artifacts/deploy-result.json')
result.write_text(json.dumps({'status': 'NOT_DEPLOYED'}))
for name, value in {'CI_PROJECT_ID': '87118196', 'CI_COMMIT_BRANCH': 'main',
                    'CI_COMMIT_REF_PROTECTED': 'true', 'CI_PIPELINE_SOURCE': 'push'}.items():
    if os.environ.get(name) != value:
        raise SystemExit('Protected main push required')
key = Path(os.environ['PROD_DEPLOY_KEY'])
key.chmod(0o600)
request = {'sha': os.environ['CI_COMMIT_SHA'], 'pipeline_id': int(os.environ['CI_PIPELINE_ID']),
           'job_id': int(os.environ['CI_JOB_ID']), 'artifact_job_id': int(os.environ['ARTIFACT_JOB_ID']), 'artifact_sha256': os.environ['RELEASE_SHA256'], 'job_token': os.environ['CI_JOB_TOKEN']}
p = subprocess.run(['ssh', '-T', '-i', str(key), '-o', 'IdentitiesOnly=yes',
                    '-o', 'StrictHostKeyChecking=yes', '-o', 'BatchMode=yes',
                    '-o', 'UserKnownHostsFile=' + os.environ['PROD_SSH_KNOWN_HOSTS'],
                    'root@5.188.30.214', 'gitlab-release'], input=json.dumps(request),
                   text=True, capture_output=True, timeout=1400)
if p.returncode:
    result.write_text(json.dumps({'status': 'DEPLOY_FAILED', 'sha': request['sha'],
                                 'pipeline_id': request['pipeline_id']}))
    print(p.stderr)
    raise SystemExit('Receiver rejected or failed deployment; inspect server receipt')
receipt = json.loads(p.stdout)
result.write_text(json.dumps(receipt, indent=2) + '\n')
if receipt.get('status') != 'DEPLOYED' or receipt.get('sha') != request['sha']:
    raise SystemExit('Receiver did not confirm exact release')
print(json.dumps(receipt, indent=2))

import urllib.request, time
for path, field in [("healthz", "version"), ("host-healthz", "release")]:
    with urllib.request.urlopen("https://calculandia.ru/" + path, timeout=20) as response:
        d = json.load(response)
    assert d["status"] == "ok" and d[field] == request["sha"]
    if field == "release": assert 0 <= time.time() - d["checkedAt"] <= 660
with urllib.request.urlopen("https://calculandia.ru/", timeout=20) as response:
    assert response.status == 200
print("Independent public exact-SHA verification passed")
