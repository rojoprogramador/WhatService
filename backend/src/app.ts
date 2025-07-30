import * as Sentry from "@sentry/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import "express-async-errors";
import path from "path";
import "reflect-metadata";
import "./bootstrap";

import bodyParser from 'body-parser';
import uploadConfig from "./config/upload";
import "./database";
import AppError from "./errors/AppError";
import { messageQueue, sendScheduledMessages } from "./queues";
import routes from "./routes";
import { logger } from "./utils/logger";
import i18nMiddleware, { LocalizedRequest } from "./middleware/i18nMiddleware";
import { t } from "./utils/i18n";

Sentry.init({ dsn: process.env.SENTRY_DSN });

const app = express();

app.set("queues", {
  messageQueue,
  sendScheduledMessages
});

const bodyparser = require('body-parser');
app.use(bodyParser.json({ limit: '10mb' }));

app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(i18nMiddleware);
app.use(Sentry.Handlers.requestHandler());
app.use("/public", express.static(uploadConfig.directory));

// Servir frontend compilado
app.use(express.static(path.join(__dirname, "../../frontend/build")));

app.use(routes);

// Catch all handler: send back React's index.html file para SPA routing
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../../frontend/build/index.html"));
  }
});

app.use(Sentry.Handlers.errorHandler());

app.use(async (err: Error, req: LocalizedRequest, res: Response, _: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(err);
    // Intentar traducir el mensaje de error si es una clave conocida
    const language = req.language || 'es';
    const translatedMessage = t(err.message, language as 'es' | 'en' | 'pt') || err.message;
    return res.status(err.statusCode).json({ error: translatedMessage });
  }

  logger.error(err);
  const language = req.language || 'es';
  const unknownErrorMessage = t('ERR_UNKNOWN_ERROR', language as 'es' | 'en' | 'pt');
  return res.status(500).json({ error: unknownErrorMessage });
});

export default app;
