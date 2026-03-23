import type { IInterestRepository } from "../domain/interest.repo";
import type { PublicInterestDTO, NewInterest } from "../domain/interest.dto";

export function makeInterestService(repo: IInterestRepository) {
  return {
    async getInterests(userId: string): Promise<PublicInterestDTO[]> {
      return repo.findByUser(userId);
    },

    async upsertInterests(
      userId: string,
      interests: NewInterest[],
    ): Promise<PublicInterestDTO[]> {
      return repo.upsertMany(userId, interests);
    },

    async getInterest(id: string): Promise<PublicInterestDTO | null> {
      return repo.findById(id);
    },

    async deleteInterest(id: string): Promise<void> {
      return repo.deleteById(id);
    },
  };
}
