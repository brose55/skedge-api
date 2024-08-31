import mongoose from "mongoose";
import supertest from "supertest";
import * as UserService from "../services/UserService";
import * as SessionService from "../services/SessionService";
import createServer from "../utils/server";
import { createUserSessionHandler } from "../controllers/SessionController";

const app = createServer();

const userId = new mongoose.Types.ObjectId().toString();
const userPayload = {
  _id: userId,
  username: "Jane Doe",
  email: "jane.doe@example.com",
};

const userInput = {
  username: "Jane Doe",
  email: "jane.doe@example.com",
  password: "Password123!",
  passwordConfirmation: "Password123!",
};

const sessionPayload = {
  _id: new mongoose.Types.ObjectId().toString(),
  user: userId,
  valid: true,
  userAgent: "PostmanRuntime/7.28.4",
  createdAt: new Date("2022-07-28T00:32:18.456Z"),
  updatedAt: new Date("2022-07-28T00:32:18.456Z"),
  __v: 0,
};

describe("user", () => {
  // test user registration
  describe("user registration", () => {
    // the username and password get validated
    describe("given the username and password are valid", () => {
      test("should return the user payload", async () => {
        const createUserServiceMock = jest
          .spyOn(UserService, "createUser")
          //  @ts-ignore
          .mockReturnValueOnce(userPayload);

        const { body, statusCode } = await supertest(app)
          .post("/api/users")
          .send(userInput);

        expect(statusCode).toBe(200);

        expect(body).toEqual(userPayload);

        expect(createUserServiceMock).toHaveBeenCalledWith(userInput);
      });
    });

    // verify that the passwords must match
    describe("given the passwords do not match", () => {
      test("should return a 400", async () => {
        const createUserServiceMock = jest
          .spyOn(UserService, "createUser")
          //  @ts-ignore
          .mockReturnValueOnce(userPayload);

        const { statusCode } = await supertest(app)
          .post("/api/users")
          .send({ ...userInput, passwordConfirmation: "doesnotmatch" });

        expect(statusCode).toBe(400);

        expect(createUserServiceMock).not.toHaveBeenCalled();
      });
    });

    // verify that the handler handles any errors
    describe("given the user service throws", () => {
      test("should return a 409 error", async () => {
        const createUserServiceMock = jest
          .spyOn(UserService, "createUser")
          .mockRejectedValue(":(");

        const { statusCode } = await supertest(app)
          .post("/api/users")
          .send(userInput);

        expect(statusCode).toBe(409);

        expect(createUserServiceMock).toHaveBeenCalled();
      });
    });
  });

  // test create user session
  describe("create user session", () => {
    // a user can login with a valid email and password
    describe("given the username and password are valid", () => {
      test("should return a signed accessToken and refresh token", async () => {
        jest
          .spyOn(UserService, "validatePassword")
          // @ts-ignore
          .mockReturnValue(userPayload);

        jest
          .spyOn(SessionService, "createSession")
          // @ts-ignore
          .mockReturnValue(sessionPayload);

        const req = {
          get: () => {
            return "a user agent";
          },
          body: {
            email: "janedoe@example.com",
            password: "Password123",
          },
        };

        const send = jest.fn();

        const res = {
          send,
          cookie: () => {
            return "cookie sent";
          },
        };

        // @ts-ignore
        await createUserSessionHandler(req, res);

        expect(send).toHaveBeenCalledWith({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        });
      });
    });
  });
});
