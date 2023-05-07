import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import fs from "node:fs";

import dotenv from "dotenv";

import { Command } from "commander";

import winston, { format, Logger } from "winston";

import Config from "./config";
import app from "./app";

type CliArgs = {
  listen: string;
  privateKey?: string;
  certificate?: string;
  root: string;
};

function defaultPort(protocol: string) {
  switch (protocol) {
    case "http:":
      return 80;
    case "https:":
      return 443;
    default:
      throw Error(`Unsupported protocol: ${protocol}`);
  }
}

async function start_http(
  config: Config,
  logger: Logger,
  args: CliArgs,
  listen: URL
) {
  let bindPort = listen.port
    ? parseInt(listen.port)
    : defaultPort(listen.protocol);
  let bindHostname = listen.hostname;

  let appInstance = await app.create(config, args.root, logger);

  return new Promise((resolve, reject) => {
    var server = http.createServer(appInstance);

    server.on("listening", () => {
      logger.info(
        `App is up and running at ${listen.protocol}//${bindHostname}:${bindPort}`
      );
    });

    server.on("error", (err: Error) => {
      reject(err);
    });

    server.on("close", () => {
      resolve(null);
    });

    server.listen(bindPort, bindHostname);
  });
}

async function start_https(
  config: Config,
  logger: Logger,
  args: CliArgs,
  listen: URL
) {
  if (!args.certificate) {
    throw Error("No SSL/TLS certificate defined");
  }

  if (!args.privateKey) {
    throw Error("No private key for SSL/TLS certificate defined");
  }

  const options = {
    key: fs.readFileSync(args.privateKey),
    cert: fs.readFileSync(args.certificate),
  };

  const bindPort = listen.port
    ? parseInt(listen.port)
    : defaultPort(listen.protocol);
  const bindHostname = listen.hostname;

  const appInstance = await app.create(config, args.root, logger);

  return new Promise((resolve, reject) => {
    var server = https.createServer(options, appInstance);

    server.on("listening", () => {
      logger.info(
        `App is up and running at ${listen.protocol}//${bindHostname}:${bindPort}`
      );
    });

    server.on("error", (err: Error) => {
      reject(err);
    });

    server.on("close", () => {
      resolve(null);
    });

    server.listen(bindPort, bindHostname);
  });
}

async function run(config: Config, logger: Logger, args: CliArgs) {
  const listen = new URL(args.listen);

  if (!/^\/([^/]+\/)*$/.test(args.root)) {
    throw Error(`Invalid root path for the app: ${args.root}`);
  }

  switch (listen.protocol) {
    case "http:":
      return start_http(config, logger, args, listen);
    case "https:":
      return start_https(config, logger, args, listen);
    default:
      throw Error(`Unsupported protocol: ${listen.protocol}`);
  }
}

const logger = winston.createLogger({
  defaultMeta: { appLabel: "app" },
  levels: winston.config.syslog.levels,
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.label({ label: "app" }),
    format.printf(
      (info) =>
        `${info.level.toUpperCase()} [${info.component || info.appLabel}] ${
          info.message
        }`
    )
  ),
  transports: [new winston.transports.Console()],
});

let appName: string;
let appVersion: string;

if (process.env.npm_package_name) {
  appName = process.env.npm_package_name;
  appVersion = process.env.npm_package_version;
} else {
  const packageData = require("../package.json");
  appName = packageData.name;
  appVersion = packageData.version;
}

dotenv.config();

const appArgs = new Command();

appArgs
  .version(appVersion)
  .option(
    "-c, --certificate <cert>",
    "Path to SSL/TLS certificate file",
    process.env.APP_CERTIFICATE ?? null
  )
  .option(
    "-k, --private-key <key>",
    "Path to SSL/TLS private key file",
    process.env.APP_PRIVATE_KEY ?? null
  )
  .option("-r, --root <path>", "Request path root", process.env.APP_ROOT ?? "/")
  .option(
    "-l, --listen <listen>",
    "Listen to address",
    process.env.APP_LISTEN ?? "http://127.0.0.1:3000"
  );

run(
  {
    appName,
    appVersion,
  },
  logger,
  appArgs.parse(process.argv).opts()
)
  .then(() => {
    logger.info("App done");
    process.exit(0);
  })
  .catch((err) => {
    logger.error("App failed: ", err);
    process.exit(1);
  });
