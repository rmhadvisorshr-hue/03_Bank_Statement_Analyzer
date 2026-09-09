import express from "express";
import cors from "cors";
import { analysisRouter } from "./src/routes/analysis.routes";
import { convertRouter } from "./src/routes/convert.routes";

export function createApiApp() {
  const app = express();

  // Only enabled when the frontend is deployed on a different origin (e.g. a
  // Vercel-hosted SPA calling this backend on its own domain) - unset in the
  // embedded/same-origin deployment, which needs no CORS headers at all.
  // Comma-separated so both a production and a preview-deployment origin can
  // be allowed at once. Must be registered before the routers below so
  // preflight OPTIONS requests get the headers.
  const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowedOrigins.length > 0) {
    app.use(cors({ origin: allowedOrigins }));
  }

  app.use(express.json({ limit: "10mb" }));

  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "ai-bank-statement-analyzer" });
  });

  app.use("/api", convertRouter);
  app.use("/api", analysisRouter);

  app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    response.status(400).json({
      code: "REQUEST_FAILED",
      message: error.message || "Request failed.",
    });
  });

  return app;
}
