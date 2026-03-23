// modules/user/__tests__/user.service.test.ts
import { makeUserService } from "../app/user.service";
import type { IUserRepository } from "../domain/user.repo";
import type { PublicUserDTO } from "../domain/user.dto";

const mockUser: PublicUserDTO = {
  _id: "123",
  username: "jane",
  email: "jane@example.com",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const makeRepo = (overrides?: Partial<IUserRepository>): IUserRepository => ({
  createPublicUser: jest.fn().mockResolvedValue(mockUser),
  authenticateUser: jest
    .fn()
    .mockResolvedValue({ ok: false, reason: "NO_USER" }),
  findPublicById: jest.fn().mockResolvedValue(null),
  findPublicWithPvById: jest.fn().mockResolvedValue(null),
  ...overrides,
});

describe("userService", () => {
  describe("createUser", () => {
    test("should return a public user DTO", async () => {
      const repo = makeRepo();
      const service = makeUserService(repo);

      const result = await service.createUser({
        username: "jane",
        email: "jane@example.com",
        password: "Password123!",
      });

      expect(result).toEqual(mockUser);
      expect(repo.createPublicUser).toHaveBeenCalledWith({
        username: "jane",
        email: "jane@example.com",
        password: "Password123!",
      });
    });
  });

  describe("validatePassword", () => {
    describe("given valid credentials", () => {
      test("should return user and passwordVersion", async () => {
        const repo = makeRepo({
          authenticateUser: jest.fn().mockResolvedValue({
            ok: true,
            user: mockUser,
            passwordVersion: 1,
          }),
        });
        const service = makeUserService(repo);

        const result = await service.validatePassword({
          email: "jane@example.com",
          password: "Password123!",
        });

        expect(result).toEqual({ user: mockUser, passwordVersion: 1 });
      });
    });

    describe("given invalid credentials", () => {
      test("should return false when user not found", async () => {
        const repo = makeRepo({
          authenticateUser: jest.fn().mockResolvedValue({
            ok: false,
            reason: "NO_USER",
          }),
        });
        const service = makeUserService(repo);

        const result = await service.validatePassword({
          email: "jane@example.com",
          password: "wrong",
        });

        expect(result).toBe(false);
      });

      test("should return false when password is wrong", async () => {
        const repo = makeRepo({
          authenticateUser: jest.fn().mockResolvedValue({
            ok: false,
            reason: "BAD_PASSWORD",
          }),
        });
        const service = makeUserService(repo);

        const result = await service.validatePassword({
          email: "jane@example.com",
          password: "wrong",
        });

        expect(result).toBe(false);
      });
    });
  });
});
