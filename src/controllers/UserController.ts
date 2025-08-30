import { Request, Response } from "express";
import { createUser } from "../services/UserService";
import { CreateUserInput } from "../schemas/UserSchema";
import logger from "../utils/logger";

// takes request and calls create user service
export async function createUserHandler(
  req: Request<{}, {}, CreateUserInput["body"]>,
  res: Response
) {
  try {
    // strip out passwordConfirmation
    const { passwordConfirmation, ...userData } = req.body;
    const user = await createUser(userData);
    return res.status(201).json(user);
  } catch (err: any) {
    logger.error({ err, at: "user.create" }, "User creation failed");
    return res.status(409).send(err?.message ?? "Conflict");
  }
}

export async function getCurrentUser(_req: Request, res: Response) {
  // assuming auth middleware stashes a public user in res.locals.user
  return res.json(res.locals.user);
}
