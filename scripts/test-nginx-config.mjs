import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const temporary = await mkdtemp(path.join(os.tmpdir(), "calculandia-nginx-"));
const certificate = path.join(temporary, "certificate.pem");
const privateKey = path.join(temporary, "private-key.pem");

function productionSafeConfig(source) {
  return source
    .replaceAll("5.188.28.98:80", "127.0.0.1:18080")
    .replaceAll("5.188.28.98:443", "127.0.0.1:18443")
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
}

try {
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
  for (const template of [
    "calculandia-bootstrap.conf",
    "calculandia-holding.conf",
    "calculandia.conf",
  ]) {
    const servers = productionSafeConfig(
      await readFile(path.join(root, "ops/nginx", template), "utf8"),
    );
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
