// modules/interest/__tests__/interest.service.test.ts
import { makeInterestService } from "../app/interest.service";
import type { IInterestRepository } from "../domain/interest.repo";
import type { PublicInterestDTO, NewInterest } from "../domain/interest.dto";

const mockInterest: PublicInterestDTO = {
  _id: "interest-123",
  userId: "user-123",
  name: "health",
  priority: "high",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockInterests: PublicInterestDTO[] = [
  mockInterest,
  {
    _id: "interest-456",
    userId: "user-123",
    name: "python",
    priority: "high",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    _id: "interest-789",
    userId: "user-123",
    name: "reading",
    priority: "low",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

const makeRepo = (
  overrides?: Partial<IInterestRepository>,
): IInterestRepository => ({
  findByUser: jest.fn().mockResolvedValue(mockInterests),
  findById: jest.fn().mockResolvedValue(mockInterest),
  upsertMany: jest.fn().mockResolvedValue(mockInterests),
  deleteById: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("interestService", () => {
  describe("getInterests", () => {
    test("should return all interests for a user", async () => {
      const repo = makeRepo();
      const service = makeInterestService(repo);

      const result = await service.getInterests("user-123");

      expect(result).toEqual(mockInterests);
      expect(repo.findByUser).toHaveBeenCalledWith("user-123");
    });

    test("should return empty array when user has no interests", async () => {
      const repo = makeRepo({
        findByUser: jest.fn().mockResolvedValue([]),
      });
      const service = makeInterestService(repo);

      const result = await service.getInterests("user-123");

      expect(result).toEqual([]);
    });
  });

  describe("getInterest", () => {
    test("should return a single interest by id", async () => {
      const repo = makeRepo();
      const service = makeInterestService(repo);

      const result = await service.getInterest("interest-123");

      expect(result).toEqual(mockInterest);
      expect(repo.findById).toHaveBeenCalledWith("interest-123");
    });

    test("should return null when interest not found", async () => {
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(null),
      });
      const service = makeInterestService(repo);

      const result = await service.getInterest("does-not-exist");

      expect(result).toBeNull();
    });
  });

  describe("upsertInterests", () => {
    test("should upsert and return all interests", async () => {
      const repo = makeRepo();
      const service = makeInterestService(repo);

      const inputs: NewInterest[] = [
        { userId: "user-123", name: "health", priority: "high" },
        { userId: "user-123", name: "python", priority: "high" },
        { userId: "user-123", name: "reading", priority: "low" },
      ];

      const result = await service.upsertInterests("user-123", inputs);

      expect(result).toEqual(mockInterests);
      expect(repo.upsertMany).toHaveBeenCalledWith("user-123", inputs);
    });
  });

  describe("deleteInterest", () => {
    test("should call deleteById on the repo", async () => {
      const repo = makeRepo();
      const service = makeInterestService(repo);

      await service.deleteInterest("interest-123");

      expect(repo.deleteById).toHaveBeenCalledWith("interest-123");
    });
  });
});
