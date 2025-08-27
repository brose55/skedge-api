import cors from "cors";
import config from "config";

export function corsMiddleware() {
  const origins = config.get<string[]>("cors.origins");

  return cors({
    origin: (origin, cb) => {
      // allow tools like curl/Postman (no Origin header)
      if (!origin) return cb(null, true);
      if (origins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: origin not allowed"));
    },
    credentials: config.get<boolean>("cors.credentials"),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-refresh"],
    exposedHeaders: ["x-access-token"],
  });
}
