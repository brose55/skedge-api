// src/types/tokens.ts
import type { JwtPayload } from "jsonwebtoken";

export type AccessRefreshPayload = JwtPayload & {
  sub: string; // user id
  pv: number; // password version
  session: string; // session id
};
