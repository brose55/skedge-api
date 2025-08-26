// controllers/SessionController.ts
import { Request, Response } from "express";
import config from "config";
import {
  createSession,
  findSessions,
  updateSession,
} from "../services/SessionService";
import { validatePassword } from "../services/UserService";
import { signJwt, verifyJwt } from "../utils/jwt";

// POST /sessions  (login)
export async function createUserSessionHandler(req: Request, res: Response) {
  // 1) Validate credentials
  const result = await validatePassword(req.body);
  if (!result) return res.status(401).send("Invalid email or password");

  const { user, passwordVersion } = result;

  // 2) Create session
  const session: any = await createSession(
    user._id,
    req.get("user-agent") || undefined
  );

  // 3) Issue tokens with { sub, pv, session }
  const accessToken = signJwt(
    { sub: user._id, pv: passwordVersion, session: session._id },
    { expiresIn: config.get("accessTokenTtl") }
  );

  const refreshToken = signJwt(
    { sub: user._id, pv: passwordVersion, session: session._id },
    { expiresIn: config.get("refreshTokenTtl") }
  );

  // 4) Set cookies (mirror your existing config)
  res.cookie("accessToken", accessToken, {
    maxAge: config.get<number>("accessTokenCookieTtl"),
    httpOnly: true,
    domain: config.get<string>("domain"),
    path: "/",
    sameSite: "strict",
    secure: true, // set true in prod
  });

  res.cookie("refreshToken", refreshToken, {
    maxAge: config.get<number>("refreshTokenCookieTtl"),
    httpOnly: true,
    domain: config.get<string>("domain"),
    path: "/",
    sameSite: "strict",
    secure: true, // set true in prod
  });

  // return tokens; optionally include the public user
  return res.status(201).send({ accessToken, refreshToken, user });
}

// GET /sessions  (list sessions for current user)
export async function getUserSessionHandler(_req: Request, res: Response) {
  // res.locals.user is a PublicUserDTO set by deserializeUser
  const me = res.locals.user;
  if (!me?._id) return res.sendStatus(401);

  const sessions = await findSessions({ user: me._id, valid: true });
  if (!sessions) return res.sendStatus(404);

  return res.send(sessions);
}

// DELETE /sessions  (logout current session)
export async function deleteUserSessionHandler(req: Request, res: Response) {
  // We can no longer trust res.locals.user.session (locals has public user only).
  // Decode a token to get the session id. Prefer refresh; fall back to access.
  const refreshToken =
    req.cookies?.refreshToken ||
    (req.headers["x-refresh"] as string | undefined);
  const accessToken =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace(/^Bearer\s/, "") ||
    undefined;

  let sessionId: string | null = null;

  if (refreshToken) {
    const { decoded } = verifyJwt(refreshToken);
    if (decoded && typeof decoded === "object" && "session" in decoded) {
      sessionId = (decoded as any).session;
    }
  }
  if (!sessionId && accessToken) {
    const { decoded } = verifyJwt(accessToken);
    if (decoded && typeof decoded === "object" && "session" in decoded) {
      sessionId = (decoded as any).session;
    }
  }

  if (sessionId) {
    await updateSession({ _id: sessionId }, { valid: false });
  }

  // Clear cookies regardless (idempotent)
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });

  return res.status(204).end();
}
