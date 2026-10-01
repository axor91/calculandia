#!/usr/bin/env python3
"""GitLab transport for the existing Calculandia immutable release transaction."""
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import socket
import subprocess
import sys
import tarfile
import tempfile
import urllib.parse
import urllib.request

PROJECT = 87118196
STATE = Path('/root/.local/share/calculandia-gitlab')
APP = Path('/var/www/calculandia')
REPO = 'https://gitlab.com/goghtools-group/calculandia.git'


def validate_request(d):
    fields = {'sha', 'pipeline_id', 'job_id', 'job_token', 'artifact_job_id', 'artifact_sha256'}
    if not isinstance(d, dict) or set(d) != fields:
        raise ValueError('Invalid request fields')
    if not isinstance(d['sha'], str) or not re.fullmatch('[a-f0-9]{40}', d['sha']):
        raise ValueError('Full SHA required')
    if not isinstance(d['artifact_sha256'], str) or not re.fullmatch('[a-f0-9]{64}', d['artifact_sha256']):
        raise ValueError('Archive checksum required')
    for k in ['pipeline_id', 'job_id', 'artifact_job_id']:
        if type(d[k]) is not int or d[k] <= 0:
            raise ValueError('Invalid job identifier')
    if not isinstance(d['job_token'], str) or not 16 <= len(d['job_token']) <= 16384:
        raise ValueError('Invalid job token')
    return d


def validate_job(j, d):
    p = j.get('pipeline', {})
    if (j.get('id') != d['job_id'] or j.get('name') != 'deploy-production'
            or j.get('stage') != 'deploy' or j.get('status') != 'running'
            or j.get('ref') != 'main' or j.get('tag') is not False
            or j.get('allow_failure') is not False or j.get('commit', {}).get('id') != d['sha']
            or p.get('id') != d['pipeline_id'] or p.get('project_id') != PROJECT
            or p.get('source') != 'push' or p.get('ref') != 'main' or p.get('sha') != d['sha']):
        raise ValueError('Job does not authorize release')


def member_path(m):
    p = PurePosixPath(m.name)
    if (p.is_absolute() or '..' in p.parts or not p.parts or p.parts[0] != 'standalone'
            or any('\n' in x or '\r' in x or x == '.git' or x == '.env' or x.startswith('.env.') for x in p.parts)
            or not (m.isfile() or m.isdir())):
        raise ValueError('Unsafe archive entry')
    return Path(*p.parts[1:])


class ArtifactRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if urllib.parse.urlsplit(newurl).scheme != 'https':
            raise ValueError('Insecure redirect')
        r = super().redirect_request(req, fp, code, msg, headers, newurl)
        if urllib.parse.urlsplit(newurl).hostname != 'gitlab.com':
            r.remove_header('Job-token')
        return r


def get(url, token, limit, target=None):
    req = urllib.request.Request(url, headers={'JOB-TOKEN': token})
    chunks = []; count = 0
    with urllib.request.build_opener(ArtifactRedirect()).open(req, timeout=90) as response:
        while True:
            b = response.read(1024**2)
            if not b:
                break
            count += len(b)
            if count > limit:
                raise ValueError('Response too large')
            if target is None:
                chunks.append(b)
            else:
                target.write(b)
    return b''.join(chunks)


def command(args, timeout=120):
    p = subprocess.run(args, env={'PATH': '/usr/sbin:/usr/bin:/sbin:/bin', 'HOME': '/root',
                                 'CALCULANDIA_LOCK_HELD': '1', 'GIT_TERMINAL_PROMPT': '0'},
                       stdin=subprocess.DEVNULL, capture_output=True, timeout=timeout)
    (STATE / 'last-command.log').write_bytes(p.stdout + p.stderr)
    if p.returncode:
        raise RuntimeError('Command failed; inspect private log')
    return p.stdout


def extract(archive, dest):
    seen = set(); total = 0
    with tarfile.open(archive, 'r|gz') as tar:
        for member in tar:
            rel = member_path(member)
            if str(rel) in seen:
                raise ValueError('Duplicate archive path')
            seen.add(str(rel)); total += member.size
            if len(seen) > 40000 or total > 1024**3 or member.size > 256 * 1024**2:
                raise ValueError('Archive exceeds unpacking limits')
            p = dest / rel
            if member.isdir():
                p.mkdir(parents=True, exist_ok=True)
            else:
                p.parent.mkdir(parents=True, exist_ok=True)
                with tar.extractfile(member) as src, p.open('xb') as out:
                    shutil.copyfileobj(src, out)
                p.chmod(0o444)
    if not {'server.js', '.next/BUILD_ID', 'ARTIFACT.sha256'} <= seen:
        raise ValueError('Incomplete release')
    for p in dest.rglob('*'):
        if p.is_dir():
            p.chmod(0o555)
    dest.chmod(0o555)


def release(d):
    validate_job(json.loads(get('https://gitlab.com/api/v4/job', d['job_token'], 131072)), d)
    if socket.gethostname() != 's7bb557e5.fastvps-server.com':
        raise ValueError('Unexpected host')
    main = command(['git', '-c', 'http.version=HTTP/1.1', '-c', 'credential.helper=',
                    '-c', 'credential.helper=store --file=' + str(STATE / 'git-credentials'),
                    '-c', 'credential.useHttpPath=true', 'ls-remote', REPO, 'refs/heads/main']).decode().split()[0]
    if main != d['sha']:
        raise ValueError('Stale main release')
    if shutil.disk_usage(APP).free < 3 * 1024**3:
        raise ValueError('Insufficient disk space')
    base = f'https://gitlab.com/api/v4/projects/{PROJECT}/jobs/{d["artifact_job_id"]}/artifacts/artifacts/'
    meta = json.loads(get(base + 'release-metadata.json', d['job_token'], 16384))
    for key, value in [('CI_COMMIT_SHA', d['sha']), ('CI_PROJECT_ID', str(PROJECT)),
                       ('CI_PIPELINE_ID', str(d['pipeline_id'])), ('CI_JOB_ID', str(d['artifact_job_id'])),
                       ('sha256', d['artifact_sha256'])]:
        if meta.get(key) != value:
            raise ValueError('Artifact provenance mismatch')
    if meta.get('receiver_sha256') != hashlib.sha256(Path(__file__).read_bytes()).hexdigest():
        raise ValueError('Install the reviewed receiver version before release')
    previous = (APP / 'current').resolve().name
    record = {'status': 'STARTED', 'sha': d['sha'], 'previous_sha': previous,
              'job_id': d['job_id'], 'pipeline_id': d['pipeline_id'],
              'artifact_job_id': d['artifact_job_id'], 'artifact_sha256': d['artifact_sha256']}
    path = STATE / ('receipt-' + str(d['job_id']) + '.json')
    def save():
        tmp = path.with_suffix('.tmp'); tmp.write_text(json.dumps(record, indent=2) + '\n'); os.replace(tmp, path)
    save()
    try:
        with tempfile.TemporaryDirectory(prefix='.gitlab-staging-', dir=APP) as folder:
            staging = Path(folder); archive = staging / 'release.tar.gz'
            with archive.open('xb') as out:
                get(base + 'release.tar.gz', d['job_token'], 200 * 1024**2, out)
            if hashlib.sha256(archive.read_bytes()).hexdigest() != d['artifact_sha256'] or archive.stat().st_size != meta['bytes']:
                raise ValueError('Archive checksum or size mismatch')
            candidate = staging / 'extract'; candidate.mkdir()
            extract(archive, candidate)
            if (candidate / '.next/BUILD_ID').read_text().strip() != d['sha']:
                raise ValueError('BUILD_ID mismatch')
            target = APP / 'releases' / d['sha']
            if target.exists():
                if target.is_symlink() or (target / 'ARTIFACT.sha256').read_bytes() != (candidate / 'ARTIFACT.sha256').read_bytes():
                    raise ValueError('Existing release differs')
            else:
                candidate.rename(target)
            command(['/usr/local/sbin/calculandia-verify-release', d['sha']])
        command(['/usr/local/sbin/calculandia-activate', d['sha']], timeout=180)
        command(['/usr/local/sbin/calculandia-publish', d['sha']], timeout=300)
        command(['/usr/local/sbin/calculandia-host-check'])
        marker = json.loads(Path('/var/lib/calculandia-monitor/health.json').read_text())
        if marker['status'] != 'ok' or marker['release'] != d['sha']:
            raise ValueError('Host marker mismatch')
        record.update(status='DEPLOYED', manifest_sha256=hashlib.sha256((target/'ARTIFACT.sha256').read_bytes()).hexdigest(),
                      host_health=marker, previous_release_retained=(APP/'releases'/previous).is_dir())
        save(); return record
    except Exception:
        record['status'] = 'FAILED'; save(); raise


def main():
    os.umask(0o077)
    if os.environ.get('SSH_ORIGINAL_COMMAND') != 'gitlab-release':
        raise ValueError('Unsupported command')
    raw = sys.stdin.buffer.read(32769)
    if len(raw) > 32768:
        raise ValueError('Request too large')
    d = validate_request(json.loads(raw))
    with Path('/run/lock/calculandia-release.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        print(json.dumps(release(d)))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('Release rejected or failed; inspect private server receipt/log.', file=sys.stderr)
        sys.exit(1)
