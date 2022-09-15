import {
	FilterQuery,
	QueryOptions,
	UpdateQuery,
} from "mongoose";
import IInterestModel from '../interfaces/IInterestModel';
import InterestModel from '../models/InterestModel';
import logger from "../utils/logger";

// findInterest

export async function findInterests(query: FilterQuery<IInterestModel>) {
	return InterestModel.find(query).lean();
}

export async function createInterests(
  query: FilterQuery<IInterestModel>,
	updates: UpdateQuery<IInterestModel>
) {
  try {
    const options = {upsert: true}
    await updates.forEach(async(update: any) => {
      await InterestModel.replaceOne(
        {value: update.value},
        {
          ...update
        },
        options
        )
    })
    return InterestModel.find(query).lean()
  } catch (error) {
    logger.error(error)
  }
}

export async function findInterest(
  query: FilterQuery<IInterestModel>,
  options: QueryOptions = { lean: true }
) {
  return InterestModel.findOne(query, {}, options)
}

//  delete an interest from previous interests
export async function deleteInterest(
  query: FilterQuery<IInterestModel>
) {
  return InterestModel.deleteOne(query)
}