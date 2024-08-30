import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import IInterestModel from "../interfaces/IInterestModel";
import InterestModel from "../models/InterestModel";
import logger from "../utils/logger";

export async function findInterests(query: FilterQuery<IInterestModel>) {
  return InterestModel.find(query).lean();
}

export async function createInterests(
  query: FilterQuery<IInterestModel>,
  updates: UpdateQuery<IInterestModel>[]
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
  query: FilterQuery<IInterestModel>,
  options: QueryOptions = { lean: true }
) {
  return InterestModel.findOne(query, {}, options);
}

//  delete an interest from previous interests
export async function deleteInterest(query: FilterQuery<IInterestModel>) {
  return InterestModel.deleteOne(query);
}
