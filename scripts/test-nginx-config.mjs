import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const temporary = await mkdtemp(path.join(os.tmpdir(), "calculandia-nginx-"));
const certificate = path.join(temporary, "certificate.pem");
const privateKey = path.join(temporary, "private-key.pem");
let supportsHttp2Directive = false;

function productionSafeConfig(source) {
  let transformed = source
    .replaceAll("203.0.113.10:80", "127.0.0.1:18080")
    .replaceAll("203.0.113.10:443", "127.0.0.1:18443")
    .replaceAll(
      "/etc/letsencrypt/live/calculandia.ru/fullchain.pem",
      certificate,
    )
    .replaceAll("/etc/letsencrypt/live/calculandia.ru/privkey.pem", privateKey)
    .replace(
      /^\s*include \/etc\/letsencrypt\/options-ssl-nginx\.conf;\s*$/gm,
      "",
    )
    .replace(/^\s*ssl_dhparam \/etc\/letsencrypt\/ssl-dhparams\.pem;\s*$/gm, "")
    .replaceAll(
      "/var/log/calculandia/access.log",
      path.join(temporary, "access.log"),
    )
    .replaceAll(
      "/var/log/calculandia/error.log",
      path.join(temporary, "error.log"),
    );
  if (!supportsHttp2Directive) {
    transformed = transformed.replace(/^\s*http2 on;\s*$/gm, "");
  }
  return transformed;
}

try {
  const versionResult = spawnSync("nginx", ["-v"], { encoding: "utf8" });
  if (versionResult.status !== 0) throw new Error("nginx is unavailable");
  const versionMatch = `${versionResult.stdout}${versionResult.stderr}`.match(
    /nginx\/(\d+)\.(\d+)\.(\d+)/,
  );
  if (!versionMatch) throw new Error("Unable to determine nginx version");
  const nginxMajor = Number(versionMatch[1]);
  const nginxMinor = Number(versionMatch[2]);
  supportsHttp2Directive = nginxMajor > 1 || nginxMinor >= 25;

  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-nodes",
      "-newkey",
      "rsa:2048",
      "-days",
      "1",
      "-subj",
      "/CN=calculandia.test",
      "-keyout",
      privateKey,
      "-out",
      certificate,
    ],
    { stdio: "ignore" },
  );

  const httpContext = await readFile(
    path.join(root, "ops/nginx/calculandia-http.conf"),
    "utf8",
  );
  const templates = new Map([
    ["calculandia-bootstrap.conf", 0],
    ["calculandia-holding.conf", 1],
    ["calculandia.conf", 2],
  ]);
  for (const [template, expectedHttp2Directives] of templates) {
    const source = await readFile(
      path.join(root, "ops/nginx", template),
      "utf8",
    );
    const actualHttp2Directives =
      source.match(/^\s*http2 on;\s*$/gm)?.length ?? 0;
    if (actualHttp2Directives !== expectedHttp2Directives) {
      throw new Error(
        `${template} has ${actualHttp2Directives} http2 directives; expected ${expectedHttp2Directives}`,
      );
    }
    const servers = productionSafeConfig(source);
    const config = `
pid ${path.join(temporary, `${template}.pid`)};
error_log ${path.join(temporary, `${template}.main-error.log`)};
events { worker_connections 64; }
http {
  include /etc/nginx/mime.types;
  ${httpContext}
  ${servers}
}
`;
    const configPath = path.join(temporary, template);
    await writeFile(configPath, config);
    execFileSync("nginx", ["-t", "-p", temporary, "-c", configPath], {
      stdio: "pipe",
    });
  }

  console.log(
    "nginx syntax passed for bootstrap, holding and production templates",
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
