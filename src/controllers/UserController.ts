import { Request, Response } from "express";
import { createUser } from "../services/UserService";
import { CreateUserInput } from "../schemas/UserSchema";
import logger from "../utils/logger";
import { omit } from "lodash";

// takes request and calls create user service
export async function createUserHandler(
    req: Request<{}, {}, CreateUserInput["body"]>, 
    res: Response
  ) {
    try {
      const user = await createUser(req.body)
      return res.send(omit(user, ['password']))
    } catch (err: any) {
      logger.error(err)
      res.status(409).send(err)
    }
}

export async function getCurrentUser( req: Request, res: Response) {
  return res.send(res.locals.user)
}