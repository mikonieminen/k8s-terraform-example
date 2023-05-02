import express, { Express } from "express";

import { Logger } from "winston";
import expressWinston from "express-winston";

import Config from "./config";

async function create(_config: Config, root: string, logger: Logger) {
  const app: Express = express();

  app.use(
    expressWinston.logger({
      winstonInstance: logger.child({ component: "http" }),
      expressFormat: true,
    })
  );

  app.get(root, (_req, res) => {
    res.send("Hello!");
  });

  return app;
}

export default {
  create,
};
