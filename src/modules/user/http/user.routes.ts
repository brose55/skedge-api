import { Router } from "express";
import { createUserHandler, getCurrentUser } from "./user.controller";
import requireUser from "@/middleware/requireUser";
import validateResource from "@/middleware/validateResource";
import { createUserSchema } from "./user.schema";

const userRouter = Router();

userRouter
  .route("/")
  .post(validateResource(createUserSchema), createUserHandler);

userRouter.route("/me").get(requireUser, getCurrentUser);

export { userRouter };
