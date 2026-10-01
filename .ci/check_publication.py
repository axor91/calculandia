#!/usr/bin/env python3
"""Check changed source or the exact public files prepared for publication.

No network, model calls, file mutations, implicit repository-wide scans, or
automatic removal of comments. JSON findings never include matched contents.
"""
from __future__ import annotations

import argparse
import collections
import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
from typing import Any
from urllib.parse import urlsplit

VERSION = "1.0.0"
MAX_TEXT_BYTES = 16 * 1024 * 1024
MAX_FILES = 20000
TEXT_SUFFIXES = {
    ".html", ".htm", ".php", ".phtml", ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx",
    ".css", ".scss", ".less", ".vue", ".svelte", ".astro", ".xml", ".svg", ".json",
    ".txt", ".webmanifest", ".map", ".py", ".sh", ".yaml", ".yml", ".toml", ".ini",
}
SERVICE_PARTS = {
    ".git", ".github", ".hg", ".svn", ".idea", ".vscode", ".agents", ".claude", ".codex",
    "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache",
    ".snapshot-raw", ".snapshot-stage", ".snapshot-transaction", ".secrets",
}
SERVICE_NAMES = {".DS_Store", ".coverage", "AGENTS.md", "CLAUDE.md"}
RESIDUE_SUFFIXES = (".swp", ".swo", ".orig", ".rej", "~")
PUBLIC_DUMPS = (".sql", ".sql.gz", ".dump", ".bak")
PRIVATE_KEY = re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----")
# Deliberately narrow literal assignment check; existing Gitleaks/CI still apply.
SECRET_ASSIGNMENT = re.compile(
    r"""(?im)^[ \t]*(?:(?:export|const|let|var|private|public|static)\s+)*"""
    r"""[$\w.-]*(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)"""
    r"""[ \t]*[:=][ \t]*(?P<q>['"])(?P<value>[A-Za-z0-9_./+=!@#%-]{16,})(?P=q)"""
)
REDACTED = b"__REDACTED_PRODUCTION_SECRET__"
AI_MARKER = re.compile(
    r"(?i)(?:\b(?:generated|written|created|produced|modified)\s+(?:by|with)\s+"
    r"(?:(?:openai|anthropic)\s+)?(?:chatgpt|claude|codex|an?\s+ai)\b"
    r"|(?:сгенерирован[аоы]?|создан[аоы]?|написан[аоы]?)\s+(?:с помощью\s+)?"
    r"(?:chatgpt|claude|codex|ии)\b"
    r"|\b(?:as an ai language model|here is the updated code)\b"
    r"|(?:как языковая модель|вот обновл[её]нный код))"
)
LICENSE = re.compile(r"(?i)\b(?:copyright|SPDX-License-Identifier|licensed under|all rights reserved)\b")
TOKENS = re.compile(r"""(?P<string>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(?P<comment><!--[\s\S]*?-->|/\*[\s\S]*?\*/|//[^\r\n]*|(?m:^[ \t]*\#[^\r\n]*))""")
DEBUG = re.compile(r"\b(?:debugger\s*;|console\.log\s*\(|var_dump\s*\(|print_r\s*\(|phpinfo\s*\()")
TEST_HOST = re.compile(r"(?i)^(?:localhost|127\.0\.0\.1|0\.0\.0\.0|example\.(?:com|org|net)|.+\.(?:test|invalid))$")
PLACEHOLDER = re.compile(r"(?i)\b(?:TODO|TBD|FIXME)\b|(?:сюда вставить|заменить перед публикацией)")
SEO_SOURCE = re.compile(r"(?i)\b(?:noindex|nofollow|canonical|x-robots-tag|hreflang)\b")
GIT_ENV = {
    **{k: v for k, v in os.environ.items() if not k.startswith("GIT_")},
    "GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": os.devnull,
    "GIT_NO_REPLACE_OBJECTS": "1", "GIT_OPTIONAL_LOCKS": "0",
    "GIT_TERMINAL_PROMPT": "0",
}


class InputError(Exception):
    pass


def issue(rule: str, severity: str, line: int = 0, signature: str = "") -> dict[str, Any]:
    return {"rule": rule, "severity": severity, "line": line, "_signature": signature or rule}


def numbered(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


class Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.canonicals: list[str] = []
        self.robots: set[str] = set()
        self.findings: list[dict[str, Any]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        line = self.getpos()[0]
        if tag == "link" and "canonical" in values.get("rel", "").lower().split():
            self.canonicals.append(values.get("href", ""))
        if tag == "meta":
            name = values.get("name", "").lower()
            content = values.get("content", "")
            if name in {"robots", "googlebot", "yandex", "bingbot"}:
                self.robots.update(re.split(r"[\s,;]+", content.lower()))
            if name == "generator" and re.search(r"(?i)\b(chatgpt|claude|codex)\b", content):
                self.findings.append(issue("AI_GENERATOR_META", "block", line, name + content))
        for key in ("href", "src", "action", "poster"):
            address = values.get(key, "")
            try:
                host = urlsplit(address).hostname or ""
            except ValueError:
                continue
            if TEST_HOST.fullmatch(host):
                self.findings.append(issue("TEST_URL_REVIEW", "review", line, key + address))

    handle_startendtag = handle_starttag


def path_findings(path: str, public: bool) -> list[dict[str, Any]]:
    parts = PurePosixPath(path).parts
    name = parts[-1]
    if (any(part in SERVICE_PARTS for part in parts) or name in SERVICE_NAMES
            or name.endswith(RESIDUE_SUFFIXES)):
        return [issue("SERVICE_ARTIFACT", "block")]
    if public and (name == ".env" or name.startswith(".env.") or name.endswith(PUBLIC_DUMPS)):
        return [issue("PUBLIC_SECRET_OR_DUMP_PATH", "block")]
    return []


def inspect(path: str, data: bytes, *, public: bool, expected: dict[str, Any] | None = None, encoding: str = "utf-8") -> list[dict[str, Any]]:
    findings = path_findings(path, public) if public else []
    # Private key markers are checked in all selected bytes, including non-text files.
    if PRIVATE_KEY.search(data):
        findings.append(issue("PRIVATE_KEY", "block"))
    suffix = PurePosixPath(path).suffix.lower()
    is_text = suffix in TEXT_SUFFIXES or PurePosixPath(path).name in {".htaccess", "robots.txt"}
    if not is_text:
        if expected:
            raise InputError("SEO expectations require a text/HTML file")
        return findings
    if len(data) > MAX_TEXT_BYTES:
        raise InputError("Selected text exceeds 16 MiB; split or review this artifact explicitly")
    try:
        text = data.decode("utf-8-sig" if encoding == "utf-8" else encoding)
    except UnicodeDecodeError:
        # Client sites may use legacy encodings. Do not label an unread scan PASS.
        raise InputError("Selected text does not match --encoding; select the known site encoding") from None
    if REDACTED in data:
        findings.append(issue("SECRET_PLACEHOLDER", "block"))
    for match in SECRET_ASSIGNMENT.finditer(text):
        findings.append(issue("LITERAL_SECRET", "block", numbered(text, match.start()),
                              hashlib.sha256(match.group().encode()).hexdigest()))
    for match in TOKENS.finditer(text):
        if match.lastgroup != "comment":
            continue
        comment = match.group()
        if LICENSE.search(comment):
            continue
        if AI_MARKER.search(comment):
            findings.append(issue("AI_SERVICE_COMMENT", "block", numbered(text, match.start()),
                                  hashlib.sha256(comment.encode()).hexdigest()))
        elif PLACEHOLDER.search(comment):
            findings.append(issue("PLACEHOLDER_REVIEW", "review", numbered(text, match.start()), comment))
    # Comments are blanked before looking for executable/debug or SEO changes.
    code = TOKENS.sub(lambda m: re.sub(r"[^\n]", " ", m.group()), text)
    for match in DEBUG.finditer(code):
        findings.append(issue("DEBUG_REVIEW", "review", numbered(code, match.start()), match.group()))
    html = suffix in {".html", ".htm", ".php", ".phtml", ".vue", ".svelte", ".astro", ".svg"}
    page = Page()
    if html:
        page.feed(text)
        findings.extend(page.findings)
    if not public and (SEO_SOURCE.search(text) or PurePosixPath(path).name in {"robots.txt", "sitemap.xml", ".htaccess"}):
        findings.append(issue("SEO_CHANGE_REVIEW", "review", signature=hashlib.sha256(text.encode()).hexdigest()))
    if expected:
        if not html:
            raise InputError("canonical/indexable expectations require HTML")
        if "canonical" in expected and page.canonicals != [expected["canonical"]]:
            findings.append(issue("CANONICAL_MISMATCH", "block"))
        if "indexable" in expected:
            noindex = bool(page.robots & {"noindex", "none"})
            if noindex == expected["indexable"]:
                findings.append(issue("ROBOTS_MISMATCH", "block"))
    return findings


def git(repo: Path, *args: str) -> bytes:
    result = subprocess.run(
        ["git", "--no-replace-objects", "-C", str(repo), *args],
        input=b"", capture_output=True, env=GIT_ENV, check=False, timeout=30,
    )
    if result.returncode:
        raise InputError("Git could not read the selected revision/index")
    return result.stdout


def revision(repo: Path, ref: str) -> str:
    value = git(repo, "rev-parse", "--verify", "--end-of-options", ref + "^{commit}").decode().strip()
    if not re.fullmatch(r"[0-9a-f]{40,64}", value):
        raise InputError("Invalid commit identity")
    return value


def git_entries(repo: Path, staged: bool, base: str | None, commit: str, paths: list[str] | None = None) -> list[dict[str, Any]]:
    args = ["diff", "--raw", "--no-abbrev", "--no-renames", "--no-ext-diff",
            "--diff-filter=ACMT", "-z"]
    if staged:
        args.append("--cached")
    elif base == "empty":
        # Use the empty tree for ANY commit, including new branches with history.
        empty_tree = git(repo, "hash-object", "-t", "tree", "--stdin").decode().strip()
        args = ["diff", "--raw", "--no-abbrev", "--no-renames", "--no-ext-diff",
                "--diff-filter=ACMT", "-z", empty_tree, revision(repo, commit)]
    else:
        args.extend([revision(repo, base or ""), revision(repo, commit)])
    chunks = git(repo, *args, "--", *(paths or [])).split(b"\0")
    entries = []
    for index in range(0, len(chunks) - 1, 2):
        if not chunks[index]:
            continue
        fields = chunks[index].decode("ascii").split()
        path = chunks[index + 1].decode("utf-8")
        if len(fields) != 5 or len(entries) >= MAX_FILES:
            raise InputError("Invalid or oversized Git selection")
        old_mode, new_mode, old_oid, new_oid, _ = fields
        if new_mode != "100644" and new_mode != "100755":
            # Submodules/symlinks require deployment-specific handling.
            entries.append({"path": path, "data": b"", "before": b"", "special": True})
            continue
        data = git(repo, "cat-file", "blob", new_oid)
        before = b"" if not old_oid.strip("0") or old_mode[1:] not in {"100644", "100755"} else git(repo, "cat-file", "blob", old_oid)
        entries.append({"path": path, "data": data, "before": before})
    return entries


def safe_path(root: Path, relative: str) -> Path:
    if not isinstance(relative, str) or not relative or "\0" in relative or "\n" in relative or "\r" in relative:
        raise InputError("Invalid publication path")
    path = PurePosixPath(relative)
    if path.is_absolute() or ".." in path.parts or not path.parts:
        raise InputError("Publication paths must stay within the explicit root")
    candidate = root
    for part in path.parts:
        candidate = candidate / part
        if candidate.is_symlink():
            raise InputError("Publication symlinks require an explicit materialized package")
    if not candidate.is_file():
        raise InputError("A selected publication file is missing or not a regular file")
    return candidate


def public_entries(root: Path, paths: list[str], manifest: Path | None, tree: bool) -> list[dict[str, Any]]:
    records: list[Any] = paths
    if manifest:
        try:
            document = json.loads(manifest.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            raise InputError("Could not read the publication manifest") from None
        if not isinstance(document, dict) or set(document) != {"files"} or not isinstance(document["files"], list):
            raise InputError('Manifest must contain a "files" list')
        records = document["files"]
    if tree:
        records = []
        for directory, subdirs, files in os.walk(root, followlinks=False):
            for name in subdirs:
                if (Path(directory) / name).is_symlink():
                    raise InputError("Publication tree contains a symlink directory")
            records.extend((Path(directory) / name).relative_to(root).as_posix() for name in files)
            if len(records) > MAX_FILES:
                raise InputError("Publication package exceeds file-count limit")
    if not records or len(records) > MAX_FILES:
        raise InputError("Publication selection is empty or too large")
    seen = set()
    entries = []
    for item in records:
        if isinstance(item, str):
            item = {"path": item}
        if not isinstance(item, dict) or set(item) - {"path", "sha256", "expected"}:
            raise InputError("Unknown manifest fields")
        relative = item.get("path")
        path = safe_path(root, relative)
        normalized = path.relative_to(root).as_posix()
        if normalized in seen:
            raise InputError("Duplicate publication path")
        seen.add(normalized)
        expected = item.get("expected", {})
        if (not isinstance(expected, dict) or set(expected) - {"canonical", "indexable"}
                or ("canonical" in expected and not isinstance(expected["canonical"], str))
                or ("indexable" in expected and not isinstance(expected["indexable"], bool))):
            raise InputError("Invalid SEO expectations")
        data = path.read_bytes()
        sha = hashlib.sha256(data).hexdigest()
        if "sha256" in item and item["sha256"] != sha:
            raise InputError("Publication file does not match its expected SHA-256")
        entries.append({"path": normalized, "data": data, "expected": expected})
    return entries


def report(entries: list[dict[str, Any]], public: bool, encoding: str = "utf-8") -> dict[str, Any]:
    files = []
    findings = []
    inherited = 0
    for entry in entries:
        path, data = entry["path"], entry["data"]
        files.append({"path": path, "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)})
        if entry.get("special"):
            current = [issue("GIT_SPECIAL_FILE_REVIEW", "review")]
        else:
            current = inspect(path, data, public=public, expected=entry.get("expected"), encoding=encoding)
        if not public and entry.get("before") and not entry.get("special"):
            old = collections.Counter(
                (f["rule"], f["_signature"]) for f in inspect(path, entry["before"], public=False, encoding=encoding)
            )
            fresh = []
            for finding in current:
                key = (finding["rule"], finding["_signature"])
                if old[key] and finding["rule"] not in {"PRIVATE_KEY", "LITERAL_SECRET", "SECRET_PLACEHOLDER"}:
                    old[key] -= 1
                    inherited += 1
                else:
                    fresh.append(finding)
            current = fresh
        for finding in current:
            findings.append({"path": path, **{k: v for k, v in finding.items() if not k.startswith("_")}})
    blocked = any(f["severity"] == "block" for f in findings)
    status = "blocked" if blocked else "review" if findings else "pass" if entries else "empty"
    fingerprint = hashlib.sha256(json.dumps(sorted(files, key=lambda f: f["path"]), sort_keys=True, ensure_ascii=True).encode()).hexdigest()
    return {"version": VERSION, "scope": "public-package" if public else "git-change",
            "status": status, "files_checked": len(files), "bytes_checked": sum(f["bytes"] for f in files),
            "selection_sha256": fingerprint, "inherited_findings": inherited,
            "files": files, "findings": findings}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="mode", required=True)
    source = commands.add_parser("git", help="Review only changed Git blobs; never scans the whole repository")
    source.add_argument("--repo", type=Path, default=Path.cwd())
    source_mode = source.add_mutually_exclusive_group(required=True)
    source_mode.add_argument("--staged", action="store_true")
    source_mode.add_argument("--base", help="Previous commit, or empty for a first publication")
    source.add_argument("--paths", nargs="+", help="Explicit Git pathspecs for application source; excludes CI/test fixtures")
    source.add_argument("--commit", default="HEAD")
    source.add_argument("--encoding", choices=("utf-8", "cp1251"), default="utf-8")
    package = commands.add_parser("files", help="Check exact public output, also usable without Git/CMS access")
    package.add_argument("--root", required=True, type=Path)
    package.add_argument("--encoding", choices=("utf-8", "cp1251"), default="utf-8")
    selection = package.add_mutually_exclusive_group(required=True)
    selection.add_argument("--paths", nargs="+")
    selection.add_argument("--manifest", type=Path)
    selection.add_argument("--tree", action="store_true", help="Only use for the actual prepared public package")
    args = parser.parse_args(argv)
    try:
        if args.mode == "git":
            entries = git_entries(args.repo.resolve(), args.staged, args.base, args.commit, args.paths)
        else:
            root = args.root.resolve(strict=True)
            if not root.is_dir():
                raise InputError("Publication root must be a directory")
            entries = public_entries(root, args.paths or [], args.manifest, args.tree)
        result = report(entries, public=args.mode == "files", encoding=args.encoding)
    except (InputError, OSError, UnicodeError, subprocess.SubprocessError) as exc:
        message = str(exc) if isinstance(exc, InputError) else "Could not read the exact selected inputs"
        print(json.dumps({"version": VERSION, "status": "error", "error": message}, ensure_ascii=False))
        return 2
    print(json.dumps(result, ensure_ascii=True, indent=2))
    # Review notices join the existing review; they do not spawn another reviewer.
    return 1 if result["status"] == "blocked" else 0


if __name__ == "__main__":
    raise SystemExit(main())
