import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { Interest, InterestModel } from "@/models/interest";
import logger from "../utils/logger";

export async function findInterests(query: FilterQuery<Interest>) {
  return InterestModel.find(query).lean();
}

export async function createInterests(
  query: FilterQuery<Interest>,
  updates: UpdateQuery<Interest>[]
) {
  try {
    const options = { upsert: true };

    // Iterate over the updates synchronously
    for (const update of updates) {
      await InterestModel.replaceOne(
        { userId: update.userId, name: update.name }, // Match by userId and name
        {
          ...update,
        },
        options
      );
    }

    // Return all interests for the user after updates
    return InterestModel.find(query).lean();
  } catch (error) {
    logger.error(error);
    throw error; // It's good practice to re-throw the error to handle it upstream if necessary
  }
}

export async function findInterest(
  query: FilterQuery<Interest>,
  options: QueryOptions = { lean: true }
) {
  return InterestModel.findOne(query, {}, options);
}

//  delete an interest from previous interests
export async function deleteInterest(query: FilterQuery<Interest>) {
  return InterestModel.deleteOne(query);
}
