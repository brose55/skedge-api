import { makeSessionService } from "../app/session.service";
import type { ISessionRepository } from "../domain/session.repo";
import type { IUserRepository } from "../../user/domain/user.repo";
import type { PublicSessionDTO } from "../domain/session.dto";
import type { PublicUserDTO } from "../../user/domain/user.dto";

const mockUser: PublicUserDTO = {
  _id: "user-123",
  username: "jane",
  email: "jane@example.com",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockSession: PublicSessionDTO = {
  _id: "session-123",
  userId: "user-123",
  userAgent: "jest",
  valid: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const makeSessionRepo = (
  overrides?: Partial<ISessionRepository>,
): ISessionRepository => ({
  createSession: jest.fn().mockResolvedValue(mockSession),
  findSessionsByUser: jest.fn().mockResolvedValue([mockSession]),
  invalidateSession: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeUserRepo = (
  overrides?: Partial<IUserRepository>,
): IUserRepository => ({
  createPublicUser: jest.fn().mockResolvedValue(mockUser),
  authenticateUser: jest
    .fn()
    .mockResolvedValue({ ok: false, reason: "NO_USER" }),
  findPublicById: jest.fn().mockResolvedValue(null),
  findPublicWithPvById: jest.fn().mockResolvedValue(null),
  ...overrides,
});

describe("sessionService", () => {
  describe("createSession", () => {
    test("should return a public session DTO", async () => {
      const sessions = makeSessionRepo();
      const users = makeUserRepo();
      const service = makeSessionService({ sessions, users });

      const result = await service.createSession("user-123", "jest");

      expect(result).toEqual(mockSession);
      expect(sessions.createSession).toHaveBeenCalledWith({
        userId: "user-123",
        userAgent: "jest",
      });
    });
  });

  describe("findSessionsByUser", () => {
    test("should return sessions for a user", async () => {
      const sessions = makeSessionRepo();
      const users = makeUserRepo();
      const service = makeSessionService({ sessions, users });

      const result = await service.findSessionsByUser("user-123");

      expect(result).toEqual([mockSession]);
      expect(sessions.findSessionsByUser).toHaveBeenCalledWith("user-123");
    });
  });

  describe("invalidateSession", () => {
    test("should call invalidateSession on the repo", async () => {
      const sessions = makeSessionRepo();
      const users = makeUserRepo();
      const service = makeSessionService({ sessions, users });

      await service.invalidateSession("session-123");

      expect(sessions.invalidateSession).toHaveBeenCalledWith("session-123");
    });
  });

  describe("validatePassword", () => {
    describe("given valid credentials", () => {
      test("should return user and passwordVersion", async () => {
        const sessions = makeSessionRepo();
        const users = makeUserRepo({
          authenticateUser: jest.fn().mockResolvedValue({
            ok: true,
            user: mockUser,
            passwordVersion: 1,
          }),
        });
        const service = makeSessionService({ sessions, users });

        const result = await service.validatePassword(
          "jane@example.com",
          "Password123!",
        );

        expect(result).toEqual({ user: mockUser, passwordVersion: 1 });
      });
    });

    describe("given invalid credentials", () => {
      test("should return false when user not found", async () => {
        const sessions = makeSessionRepo();
        const users = makeUserRepo({
          authenticateUser: jest.fn().mockResolvedValue({
            ok: false,
            reason: "NO_USER",
          }),
        });
        const service = makeSessionService({ sessions, users });

        const result = await service.validatePassword(
          "jane@example.com",
          "wrong",
        );

        expect(result).toBe(false);
      });

      test("should return false when password is wrong", async () => {
        const sessions = makeSessionRepo();
        const users = makeUserRepo({
          authenticateUser: jest.fn().mockResolvedValue({
            ok: false,
            reason: "BAD_PASSWORD",
          }),
        });
        const service = makeSessionService({ sessions, users });

        const result = await service.validatePassword(
          "jane@example.com",
          "wrong",
        );

        expect(result).toBe(false);
      });
    });
  });
});
