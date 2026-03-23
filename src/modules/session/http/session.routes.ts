import { Router } from "express";
import {
  createUserSessionHandler,
  deleteUserSessionHandler,
  getUserSessionHandler,
} from "./session.controller";
import requireUser from "@/middleware/requireUser";
import validateResource from "@/middleware/validateResource";
import { createSessionSchema } from "./session.schema";

const sessionRouter = Router();

sessionRouter
  .route("/")
  .get(requireUser, getUserSessionHandler)
  .post(validateResource(createSessionSchema), createUserSessionHandler)
  .delete(requireUser, deleteUserSessionHandler);

export { sessionRouter };
