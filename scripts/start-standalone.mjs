import path from "node:path";
import { pathToFileURL } from "node:url";

process.env.PORT ||= "3212";
process.env.HOSTNAME ||= "127.0.0.1";

const serverFile = path.resolve(".next", "standalone", "server.js");
await import(pathToFileURL(serverFile).href);
