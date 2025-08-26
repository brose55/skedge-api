import jwt from "jsonwebtoken";
import config from "config";

export type VerifyJwtResult = {
  valid: boolean;
  expired: boolean;
  decoded: null | string | jwt.JwtPayload;
};

const privateKey = config.get<string>("privateKey");
const publicKey = config.get<string>("publicKey");

export function signJwt(payload: object, options?: jwt.SignOptions) {
  return jwt.sign(payload, privateKey, {
    ...(options || {}),
    algorithm: "RS256",
  });
}

export function verifyJwt(token: string): VerifyJwtResult {
  try {
    const decoded = jwt.verify(token, publicKey);
    return { valid: true, expired: false, decoded };
  } catch (err: any) {
    // IMPORTANT: don't assign to err.message — compare it
    const isExpired =
      err?.name === "TokenExpiredError" || err?.message === "jwt expired";
    return { valid: false, expired: isExpired, decoded: null };
  }
}
