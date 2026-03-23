// modules/interest/http/interest.controller.ts
import { Request, Response } from "express";
import { interestService } from "../app/interest.service.instance";
import type {
  CreateInterestsInput,
  DeleteInterestInput,
} from "./interest.schema";
import type { NewInterest } from "../domain/interest.dto";
import logger from "@/utils/logger";

export async function getInterestsHandler(req: Request, res: Response) {
  const userId = res.locals.user._id;
  try {
    const interests = await interestService.getInterests(userId);
    return res.status(200).send(interests ?? []);
  } catch (err) {
    logger.error({ err, at: "interest.get" }, "Failed to retrieve interests");
    return res.status(500).send("Failed to retrieve interests");
  }
}

export async function createInterestsHandler(
  req: Request<{}, {}, CreateInterestsInput["body"]>,
  res: Response,
) {
  const userId = res.locals.user._id;
  const inputs: NewInterest[] = req.body.map((i) => ({
    userId,
    name: i.name,
    priority: i.priority,
  }));
  try {
    const interests = await interestService.upsertInterests(userId, inputs);
    return res.send(interests);
  } catch (err) {
    logger.error({ err, at: "interest.create" }, "Failed to create interests");
    return res.status(500).send("Failed to create interests");
  }
}

export async function deleteInterestHandler(
  req: Request<DeleteInterestInput["params"]>,
  res: Response,
) {
  const userId = res.locals.user._id;
  const interestId = req.params.interestId;

  const interest = await interestService.getInterest(interestId);
  if (!interest) return res.sendStatus(404);
  if (interest.userId !== userId) return res.sendStatus(403);

  await interestService.deleteInterest(interestId);
  return res.sendStatus(200);
}
