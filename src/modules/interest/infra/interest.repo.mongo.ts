import InterestModel from "./interest.model";
import type { IInterestRepository } from "../domain/interest.repo";
import {
  PUBLIC_INTEREST_PROJECTION,
  type PublicInterestDTO,
  type NewInterest,
} from "../domain/interest.dto";

export const interestRepository: IInterestRepository = {
  async findByUser(userId): Promise<PublicInterestDTO[]> {
    return InterestModel.find({ userId })
      .select(PUBLIC_INTEREST_PROJECTION)
      .lean<PublicInterestDTO[]>()
      .exec();
  },

  async findById(id): Promise<PublicInterestDTO | null> {
    return InterestModel.findById(id)
      .select(PUBLIC_INTEREST_PROJECTION)
      .lean<PublicInterestDTO>()
      .exec();
  },

  async upsertMany(userId, interests): Promise<PublicInterestDTO[]> {
    for (const interest of interests) {
      await InterestModel.findOneAndUpdate(
        { userId, name: interest.name },
        { $set: { priority: interest.priority } },
        { upsert: true, setDefaultsOnInsert: true, new: true },
      );
    }
    return InterestModel.find({ userId })
      .select(PUBLIC_INTEREST_PROJECTION)
      .lean<PublicInterestDTO[]>()
      .exec();
  },

  async deleteById(id): Promise<void> {
    await InterestModel.deleteOne({ _id: id });
  },
};
