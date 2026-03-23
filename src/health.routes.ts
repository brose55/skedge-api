// src/health.routes.ts
import { Router } from "express";

const healthRouter = Router();

healthRouter.get("/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export { healthRouter };
