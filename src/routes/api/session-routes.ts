import { Router } from "express";
import { createUserSessionHandler, deleteUserSessionHandler, getUserSessionHandler } from "../../controllers/SessionController";
import requireUser from "../../middleware/requireUser";
import validateResource from "../../middleware/validateResource";
import { createSessionSchema } from "../../schemas/SessionSchema";

const router = Router();

router.route("/")
  .get(requireUser, getUserSessionHandler)
  .post(validateResource(createSessionSchema), createUserSessionHandler)
  .delete(requireUser, deleteUserSessionHandler)

export default router;
