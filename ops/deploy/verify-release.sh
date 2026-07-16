#!/usr/bin/env bash
set -Eeuo pipefail

sha=${1:-}
if [[ ! $sha =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: $0 <40-character-git-sha>" >&2
  exit 1
fi

if [[ ${CALCULANDIA_GUARD_TEST_MODE:-0} == 1 ]]; then
  app_root=${CALCULANDIA_APP_ROOT:?CALCULANDIA_APP_ROOT is required in test mode}
  expected_user=${CALCULANDIA_RELEASE_USER:?CALCULANDIA_RELEASE_USER is required in test mode}
  expected_group=${CALCULANDIA_RELEASE_GROUP:?CALCULANDIA_RELEASE_GROUP is required in test mode}
  [[ $app_root == /tmp/* ]] || {
    echo "Test app root must be below /tmp" >&2
    exit 1
  }
else
  if [[ ${EUID} -ne 0 ]]; then
    echo "verify-release must run as root" >&2
    exit 1
  fi
  app_root=/var/www/calculandia
  expected_user=root
  expected_group=root
fi

release="$app_root/releases/$sha"
[[ -d $release && ! -L $release ]] || {
  echo "Release directory is missing or is a symlink: $release" >&2
  exit 1
}

unsafe_type=$(find "$release" -xdev ! -type f ! -type d -print -quit)
[[ -z $unsafe_type ]] || {
  echo "Release tree contains a non-regular path: $unsafe_type" >&2
  exit 1
}

unsafe_name=$(find "$release" -xdev \( -name $'*\n*' -o -name $'*\r*' \) -print -quit)
[[ -z $unsafe_name ]] || {
  echo "Release tree contains a CR/LF filename" >&2
  exit 1
}

wrong_owner=$(find "$release" -xdev \( ! -user "$expected_user" -o ! -group "$expected_group" \) -print -quit)
[[ -z $wrong_owner ]] || {
  echo "Release path has unexpected ownership: $wrong_owner" >&2
  exit 1
}

writable_path=$(find "$release" -xdev -perm /0222 -print -quit)
[[ -z $writable_path ]] || {
  echo "Release tree contains a writable path: $writable_path" >&2
  exit 1
}

environment_file=$(find "$release" -xdev -type f \( -name '.env' -o -name '.env.*' \) -print -quit)
[[ -z $environment_file ]] || {
  echo "Release tree contains an environment file: $environment_file" >&2
  exit 1
}

for required_file in ARTIFACT.sha256 server.js .next/BUILD_ID; do
  [[ -f $release/$required_file ]] || {
    echo "Required release file is missing: $required_file" >&2
    exit 1
  }
done
[[ -d $release/.next/static ]] || {
  echo "Required release directory is missing: .next/static" >&2
  exit 1
}
find "$release/.next/static" -type f -print -quit | grep -q . || {
  echo "Release static directory is empty" >&2
  exit 1
}

[[ $(tr -d '\r\n' < "$release/.next/BUILD_ID") == "$sha" ]] || {
  echo "BUILD_ID does not match release directory" >&2
  exit 1
}

actual_files=$(mktemp)
manifest_files=$(mktemp)
cleanup() {
  rm -f "$actual_files" "$manifest_files"
}
trap cleanup EXIT

(
  cd "$release"
  find . -xdev -type f ! -path './ARTIFACT.sha256' -printf '%P\n' |
    LC_ALL=C sort >"$actual_files"

  while IFS= read -r line || [[ -n $line ]]; do
    hash=${line:0:64}
    separator=${line:64:2}
    file=${line:66}
    if [[ ! $hash =~ ^[0-9a-f]{64}$ || $separator != "  " || -z $file || $file == /* || $file == ./* || $file == *$'\r'* || $file == *$'\n'* || "/$file/" == *"/../"* ]]; then
      echo "Artifact manifest contains an unsafe entry" >&2
      exit 1
    fi
    printf '%s\n' "$file" >>"$manifest_files"
  done <ARTIFACT.sha256

  LC_ALL=C sort -o "$manifest_files" "$manifest_files"
  cmp --silent "$actual_files" "$manifest_files" || {
    echo "Artifact manifest inventory mismatch (missing or extra files)" >&2
    exit 1
  }
  sha256sum --quiet --strict --check ARTIFACT.sha256
)

echo "Release tree verified for $sha"
