import hashlib, json, os, tarfile
from pathlib import Path
p = Path("artifacts"); p.mkdir(exist_ok=True)
archive = p / "release.tar.gz"
with tarfile.open(archive, "w:gz", dereference=True) as t:
    t.add(".next/standalone", arcname="standalone")
h = hashlib.sha256(archive.read_bytes()).hexdigest()
metadata = {k: os.environ[k] for k in ["CI_COMMIT_SHA", "CI_PROJECT_ID", "CI_PIPELINE_ID", "CI_JOB_ID"]}
metadata.update(sha256=h, bytes=archive.stat().st_size, receiver_sha256=hashlib.sha256(Path(".ci/receiver.py").read_bytes()).hexdigest())
(p / "release-metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
(p / "release.env").write_text("ARTIFACT_JOB_ID=" + os.environ["CI_JOB_ID"] + "\nRELEASE_SHA256=" + h + "\n")
print(json.dumps(metadata))
