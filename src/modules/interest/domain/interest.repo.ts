import type { PublicInterestDTO, NewInterest } from "./interest.dto";

export interface IInterestRepository {
  findByUser(userId: string): Promise<PublicInterestDTO[]>;
  findById(id: string): Promise<PublicInterestDTO | null>;
  upsertMany(
    userId: string,
    interests: NewInterest[],
  ): Promise<PublicInterestDTO[]>;
  deleteById(id: string): Promise<void>;
}
