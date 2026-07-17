#!/usr/bin/env bash
set -Eeuo pipefail

sha=${1:-}
if [[ ! $sha =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: $0 <40-character-git-sha>" >&2
  exit 1
fi

origin=https://calculandia.ru
curl_https=(curl --proto '=https' --tlsv1.2 --fail --silent --show-error --max-time 15)
workdir=$(mktemp -d)
cleanup() {
  rm -rf "$workdir"
}
trap cleanup EXIT

assert_header() {
  local file=$1
  local pattern=$2
  local label=$3
  grep -Eiq "$pattern" "$file" || {
    echo "Missing or invalid $label header" >&2
    exit 1
  }
}

"${curl_https[@]}" --dump-header "$workdir/home.headers" --output "$workdir/home.html" "$origin/"
assert_header "$workdir/home.headers" '^content-security-policy:' 'Content-Security-Policy'
assert_header "$workdir/home.headers" '^x-content-type-options:[[:space:]]*nosniff' 'X-Content-Type-Options'
assert_header "$workdir/home.headers" '^referrer-policy:' 'Referrer-Policy'
assert_header "$workdir/home.headers" '^permissions-policy:' 'Permissions-Policy'
assert_header "$workdir/home.headers" '^strict-transport-security:' 'Strict-Transport-Security'
! grep -Eiq '^x-robots-tag:.*noindex' "$workdir/home.headers" || {
  echo "Homepage is blocked from indexing by X-Robots-Tag" >&2
  exit 1
}
grep -Fq '<link rel="canonical" href="https://calculandia.ru"' "$workdir/home.html" || {
  echo "Homepage canonical is missing" >&2
  exit 1
}
grep -Fq 'application/ld+json' "$workdir/home.html" || {
  echo "Homepage JSON-LD is missing" >&2
  exit 1
}

"${curl_https[@]}" --output "$workdir/health.json" "$origin/healthz"
"${curl_https[@]}" --output "$workdir/host-health.json" "$origin/host-healthz"
"${curl_https[@]}" --output "$workdir/sitemap.xml" "$origin/sitemap.xml"
"${curl_https[@]}" --output "$workdir/robots.txt" "$origin/robots.txt"

/opt/nodejs/node-v22.22.2-linux-x64/bin/node - "$workdir/health.json" "$sha" <<'NODE'
const [file, expected] = process.argv.slice(2);
const value = JSON.parse(require("node:fs").readFileSync(file, "utf8"));
if (value.status !== "ok" || value.version !== expected) process.exit(1);
NODE

/opt/nodejs/node-v22.22.2-linux-x64/bin/node - "$workdir/host-health.json" "$sha" <<'NODE'
const [file, expected] = process.argv.slice(2);
const value = JSON.parse(require("node:fs").readFileSync(file, "utf8"));
const now = Math.floor(Date.now() / 1000);
if (
  value.status !== "ok" ||
  value.release !== expected ||
  !Number.isSafeInteger(value.checkedAt) ||
  now - value.checkedAt < 0 ||
  now - value.checkedAt > 660 ||
  !Number.isSafeInteger(value.pm2Restarts) ||
  value.pm2Restarts < 0
) process.exit(1);
NODE

grep -Fq 'Sitemap: https://calculandia.ru/sitemap.xml' "$workdir/robots.txt"
grep -Fq 'Disallow: /healthz' "$workdir/robots.txt"
grep -Fq 'Disallow: /host-healthz' "$workdir/robots.txt"
grep -Fq 'Disallow: /api/' "$workdir/robots.txt"
! grep -Eq '^Disallow:[[:space:]]*/[[:space:]]*$' "$workdir/robots.txt" || {
  echo "robots.txt blocks the entire site" >&2
  exit 1
}

mapfile -t urls < <(grep -oE '<loc>[^<]+</loc>' "$workdir/sitemap.xml" | sed -E 's#</?loc>##g')
[[ ${#urls[@]} -eq 41 ]] || {
  echo "Expected 41 sitemap URLs, received ${#urls[@]}" >&2
  exit 1
}
[[ $(printf '%s\n' "${urls[@]}" | LC_ALL=C sort -u | wc -l) -eq 41 ]] || {
  echo "Sitemap contains duplicate URLs" >&2
  exit 1
}

external_sources="$workdir/external-sources.txt"
: >"$external_sources"

for index in "${!urls[@]}"; do
  url=${urls[$index]}
  [[ $url == "$origin" || $url == "$origin/"* ]] || {
    echo "Non-canonical sitemap URL: $url" >&2
    exit 1
  }
  page="$workdir/page-$index.html"
  headers="$workdir/page-$index.headers"
  "${curl_https[@]}" --dump-header "$headers" --output "$page" "$url"
  assert_header "$headers" '^content-security-policy:' 'Content-Security-Policy'
  ! grep -Eiq '^x-robots-tag:.*noindex' "$headers" || {
    echo "Indexable URL is blocked by X-Robots-Tag: $url" >&2
    exit 1
  }
  ! grep -Eiq '<meta[^>]+name="robots"[^>]+content="[^"]*noindex' "$page" || {
    echo "Indexable URL has a noindex meta tag: $url" >&2
    exit 1
  }
  grep -Fq "<link rel=\"canonical\" href=\"$url\"" "$page" || {
    echo "Self canonical missing for $url" >&2
    exit 1
  }
  if [[ $url == "$origin/kalkulyator/"* ]]; then
    grep -Fq '"@type":"WebApplication"' "$page" || {
      echo "WebApplication schema missing for $url" >&2
      exit 1
    }
    grep -oE 'href="https://[^" ]+' "$page" | sed -E 's/^href="//' | grep -v '^https://calculandia.ru' >>"$external_sources" || true
  fi
done

asset=$(grep -oE '/_next/static/[^"? ]+' "$workdir/home.html" | head -n 1 || true)
[[ -n $asset ]] || { echo "No static asset found in homepage" >&2; exit 1; }
"${curl_https[@]}" --dump-header "$workdir/asset.headers" --output /dev/null "$origin$asset"
assert_header "$workdir/asset.headers" '^cache-control:.*immutable' 'immutable asset Cache-Control'

declare -A redirects=(
  [/calculator/days]=/kalkulyator/dni-mezhdu-datami
  [/calculator/fractions]=/kalkulyator/drobi
  [/calculator/mortgage]=/kalkulyator/ipoteka
  [/calculator/percent-diff]=/kalkulyator/procentnoe-izmenenie
)
for source in "${!redirects[@]}"; do
  headers="$workdir/redirect-${source##*/}.headers"
  curl --proto '=https' --tlsv1.2 --silent --show-error --max-time 15 --output /dev/null --dump-header "$headers" "$origin$source"
  grep -Eq '^HTTP/[0-9.]+ 301' "$headers"
  grep -Eiq "^location:[[:space:]]*$origin${redirects[$source]}([[:space:]]|\r)*$" "$headers"
done

curl --silent --show-error --max-time 15 --output /dev/null --dump-header "$workdir/http.headers" http://calculandia.ru/kalkulyatory
grep -Eq '^HTTP/[0-9.]+ 301' "$workdir/http.headers"
grep -Eiq '^location:[[:space:]]*https://calculandia.ru/kalkulyatory([[:space:]]|\r)*$' "$workdir/http.headers"

"${curl_https[@]}" --output /dev/null --dump-header "$workdir/www.headers" https://www.calculandia.ru/kalkulyatory
grep -Eq '^HTTP/[0-9.]+ 301' "$workdir/www.headers"
grep -Eiq '^location:[[:space:]]*https://calculandia.ru/kalkulyatory([[:space:]]|\r)*$' "$workdir/www.headers"

not_found_status=$(curl --proto '=https' --tlsv1.2 --silent --show-error --max-time 15 --output "$workdir/404.html" --write-out '%{http_code}' "$origin/release-smoke-not-found")
[[ $not_found_status == 404 ]]
grep -Eiq '<meta name="robots" content="noindex' "$workdir/404.html"
! grep -Fq '<link rel="canonical"' "$workdir/404.html"

[[ $(LC_ALL=C sort -u "$external_sources" | wc -l) -ge 9 ]] || {
  echo "Calculator pages contain fewer than 9 unique external references" >&2
  exit 1
}

echo "External production smoke passed for $sha: host/runtime health, 41 sitemap URLs, redirects, TLS, headers, schema, assets, sources and 404"
