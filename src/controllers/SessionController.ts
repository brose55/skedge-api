import { Request, Response } from "express";
import config from "config";
import {
  createSession,
  findSessions,
  updateSession,
} from "../services/SessionService";
import { validatePassword } from "../services/UserService";
import { signJwt } from "../utils/jwt";

export async function createUserSessionHandler(req: Request, res: Response) {
  // validate user's password
  const user = await validatePassword(req.body);
  if (!user) {
    return res.status(401).send("Invalid email or password");
  }

  // create session
  const session: any = await createSession(
    user._id.toString(), // Ensure _id is a string
    req.get("user-agent") || ""
  );

  // create access token
  const accessToken = signJwt(
    { ...user, session: session._id },
    { expiresIn: config.get("accessTokenTtl") }
  );

  // create refresh token
  const refreshToken = signJwt(
    { ...user, session: session._id },
    { expiresIn: config.get("refreshTokenTtl") }
  );

  const domain = config.get("domain");
  const accessAge = config.get("accessTokenCookieTtl");
  const refreshAge = config.get("refreshTokenCookieTtl");
  // return both tokens
  res.cookie("accessToken", accessToken, {
    maxAge: config.get("accessTokenCookieTtl"),
    // TODO: set to true in production
    httpOnly: true,
    domain: config.get("domain"),
    path: "/",
    sameSite: "strict",
    // TODO: set to true in production
    secure: true,
  });

  res.cookie("refreshToken", refreshToken, {
    maxAge: config.get("refreshTokenCookieTtl"),
    // TODO: set to true in production
    httpOnly: true,
    domain: config.get("domain"),
    path: "/",
    sameSite: "strict",
    // TODO: set to true in production
    secure: true,
  });

  return res.send({ accessToken, refreshToken });
}

export async function getUserSessionHandler(req: Request, res: Response) {
  const userId = res.locals.user._id;

  const sessions = await findSessions({ user: userId, valid: true });

  if (!sessions) {
    res.sendStatus(404);
  }

  return res.send(sessions);
}

export async function deleteUserSessionHandler(req: Request, res: Response) {
  const sessionId = res.locals.user.session;

  await updateSession({ _id: sessionId }, { valid: false });

  return res.send({
    accessToken: null,
    refreshToken: null,
  });
}
