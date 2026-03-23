// modules/interest/http/interest.routes.ts
import { Router } from "express";
import {
  getInterestsHandler,
  createInterestsHandler,
  deleteInterestHandler,
} from "./interest.controller";
import requireUser from "@/middleware/requireUser";
import validateResource from "@/middleware/validateResource";
import { createInterestsSchema, deleteInterestSchema } from "./interest.schema";

const interestRouter = Router();

interestRouter
  .route("/")
  .get(requireUser, getInterestsHandler)
  .put(
    [requireUser, validateResource(createInterestsSchema)],
    createInterestsHandler,
  );

interestRouter
  .route("/:interestId")
  .delete(
    [requireUser, validateResource(deleteInterestSchema)],
    deleteInterestHandler,
  );

export { interestRouter };
