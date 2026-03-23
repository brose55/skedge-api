// src/router.ts
import { Router } from "express";
import { userRouter } from "./modules/user/http/user.routes";
import { sessionRouter } from "./modules/session/http/session.routes";
import { interestRouter } from "./modules/interest/http/interest.routes";
import { healthRouter } from "./health.routes";

const router = Router();

router.use("/health", healthRouter);
router.use("/api/users", userRouter);
router.use("/api/sessions", sessionRouter);
router.use("/api/interests", interestRouter);

export default router;
