import { Request, Response } from "express";
import {
  CreateInterestsInput,
  DeleteInterestInput,
} from "../schemas/InterestSchema";
import {
  findInterests,
  findInterest,
  createInterests,
  deleteInterest,
} from "../services/InterestServices";
import logger from "../utils/logger";

export async function getInterestsHandler(req: Request, res: Response) {
  const userId = res.locals.user._id;
  try {
    const interests = await findInterests({ userId });

    console.log("get interests: ", interests);

    if (!interests || interests.length === 0) {
      return res.status(200).send([]);
    }

    return res.status(200).send(interests);
  } catch (err) {
    console.error("Error retrieving interests:", err);
    return res.status(500).send("Failed to retrieve interests");
  }
}

export async function createInterestsHandler(
  req: Request<{}, {}, CreateInterestsInput["body"][]>,
  res: Response
) {
  const userId = res.locals.user._id;
  console.log("body: ", req.body);

  const updates = req.body.map((interest) => ({ userId, ...interest }));

  try {
    const interests = await createInterests({ userId }, updates);
    return res.send(interests);
  } catch (err) {
    console.error("Error creating interests:", err);
    return res.status(500).send("Failed to create interests");
  }
}

export async function deleteInterestHandler(
  req: Request<DeleteInterestInput["params"]>,
  res: Response
) {
  const userId = res.locals.user._id;
  const interestId = req.params.interestId;
  const interest = await findInterest({ interestId });

  if (!interest) {
    return res.status(404);
  }

  if (String(interest.userId) !== userId) {
    return res.status(403);
  }

  await deleteInterest({ _id: interestId });

  return res.sendStatus(200);
}
