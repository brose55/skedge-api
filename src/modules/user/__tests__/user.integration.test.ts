import mongoose from "mongoose";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import createServer from "@/utils/server";

const app = createServer();

const validUser = {
  username: "jane",
  email: "jane@example.com",
  password: "Password123!",
  passwordConfirmation: "Password123!",
};

describe("user routes", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe("POST /api/users", () => {
    describe("given valid input", () => {
      test("should return 201 and a public user DTO", async () => {
        const { statusCode, body } = await supertest(app)
          .post("/api/users")
          .send(validUser);

        expect(statusCode).toBe(201);
        expect(body).toMatchObject({
          username: "jane",
          email: "jane@example.com",
        });

        // should never return sensitive fields
        expect(body.password).toBeUndefined();
        expect(body.passwordVersion).toBeUndefined();
        expect(body.__v).toBeUndefined();
      });
    });

    describe("given passwords do not match", () => {
      test("should return 400", async () => {
        const { statusCode } = await supertest(app)
          .post("/api/users")
          .send({ ...validUser, passwordConfirmation: "doesnotmatch" });

        expect(statusCode).toBe(400);
      });
    });

    describe("given a duplicate email", () => {
      test("should return 409", async () => {
        // create once
        await supertest(app).post("/api/users").send(validUser);

        // try to create again with same email
        const { statusCode } = await supertest(app)
          .post("/api/users")
          .send(validUser);

        expect(statusCode).toBe(409);
      });
    });
    describe("given missing fields", () => {
      test("should return 400 when email is missing", async () => {
        const { statusCode } = await supertest(app).post("/api/users").send({
          username: "jane",
          password: "Password123!",
          passwordConfirmation: "Password123!",
        });

        expect(statusCode).toBe(400);
      });

      test("should return 400 when password is missing", async () => {
        const { statusCode } = await supertest(app)
          .post("/api/users")
          .send({ username: "jane", email: "jane@example.com" });

        expect(statusCode).toBe(400);
      });
    });
  });

  describe("GET /api/users/me", () => {
    describe("given the user is not logged in", () => {
      test("should return 403", async () => {
        const { statusCode } = await supertest(app).get("/api/users/me");
        expect(statusCode).toBe(403);
      });
    });

    describe("given the user is logged in", () => {
      test("should return the current user", async () => {
        // register
        await supertest(app).post("/api/users").send(validUser);

        // login to get a token
        const loginRes = await supertest(app)
          .post("/api/sessions")
          .send({ email: validUser.email, password: validUser.password });

        const { accessToken } = loginRes.body;

        const { statusCode, body } = await supertest(app)
          .get("/api/users/me")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(statusCode).toBe(200);
        expect(body).toMatchObject({
          username: "jane",
          email: "jane@example.com",
        });
        expect(body.password).toBeUndefined();
      });
    });
  });
});
