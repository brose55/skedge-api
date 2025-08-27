// @/utils/jwt.ts
import jwt, {
  TokenExpiredError,
  type JwtPayload,
  type SignOptions,
} from "jsonwebtoken";
import config from "config";

export type VerifyJwtSuccess = {
  valid: true;
  expired: false;
  decoded: string | JwtPayload;
};
export type VerifyJwtFailure = {
  valid: false;
  expired: boolean;
  decoded: null;
  error?: unknown;
};
export type VerifyJwtResult = VerifyJwtSuccess | VerifyJwtFailure;

// normalize both real newlines and "\n" escapes (safe either way)
const normalizeKey = (k: string) =>
  k.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();

const privateKey = normalizeKey(config.get<string>("privateKey"));
const publicKey = normalizeKey(config.get<string>("publicKey"));

// NEW: read issuer/audience from config
const { issuer, audience } = config.get<{ issuer: string; audience: string }>(
  "jwt"
);

export function signJwt(payload: object, options?: SignOptions) {
  const base: SignOptions = {
    algorithm: "RS256",
    issuer,
    audience,
  };
  // allow callers to override via `options` if needed
  return jwt.sign(payload, privateKey, { ...base, ...(options || {}) });
}

export function verifyJwt(token: string): VerifyJwtResult {
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      issuer,
      audience,
      clockTolerance: 5,
    });
    return { valid: true, expired: false, decoded };
  } catch (err: unknown) {
    const isExpired = err instanceof TokenExpiredError;
    return { valid: false, expired: isExpired, decoded: null, error: err };
  }
}
