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

describe("session routes", () => {
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
    await mongoose.connection.dropDatabase();
  });

  describe("POST /api/sessions", () => {
    describe("given valid credentials", () => {
      test("should return 201 with access and refresh tokens", async () => {
        await supertest(app).post("/api/users").send(validUser);

        const { statusCode, body } = await supertest(app)
          .post("/api/sessions")
          .send({ email: validUser.email, password: validUser.password });

        expect(statusCode).toBe(201);
        expect(body.accessToken).toBeDefined();
        expect(body.refreshToken).toBeDefined();
        expect(body.user).toMatchObject({
          username: "jane",
          email: "jane@example.com",
        });
        expect(body.user.password).toBeUndefined();
      });
    });

    describe("given invalid credentials", () => {
      test("should return 401 when user does not exist", async () => {
        const { statusCode } = await supertest(app)
          .post("/api/sessions")
          .send({ email: "nobody@example.com", password: "Password123!" });

        expect(statusCode).toBe(401);
      });

      test("should return 401 when password is wrong", async () => {
        await supertest(app).post("/api/users").send(validUser);

        const { statusCode } = await supertest(app)
          .post("/api/sessions")
          .send({ email: validUser.email, password: "Wrongpassword1!" });

        expect(statusCode).toBe(401);
      });
    });
  });

  describe("GET /api/sessions", () => {
    describe("given the user is not logged in", () => {
      test("should return 403", async () => {
        const { statusCode } = await supertest(app).get("/api/sessions");
        expect(statusCode).toBe(403);
      });
    });

    describe("given the user is logged in", () => {
      test("should return the user's sessions", async () => {
        await supertest(app).post("/api/users").send(validUser);

        const loginRes = await supertest(app)
          .post("/api/sessions")
          .send({ email: validUser.email, password: validUser.password });

        const { accessToken } = loginRes.body;

        const { statusCode, body } = await supertest(app)
          .get("/api/sessions")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(statusCode).toBe(200);
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({
          userId: expect.any(String),
          valid: true,
        });
        expect(body[0].password).toBeUndefined();
      });
    });
  });

  describe("DELETE /api/sessions", () => {
    describe("given the user is logged in", () => {
      test("should return 204 and invalidate the session", async () => {
        await supertest(app).post("/api/users").send(validUser);

        const loginRes = await supertest(app)
          .post("/api/sessions")
          .send({ email: validUser.email, password: validUser.password });

        const { accessToken, refreshToken } = loginRes.body;

        const { statusCode } = await supertest(app)
          .delete("/api/sessions")
          .set("Authorization", `Bearer ${accessToken}`)
          .set("x-refresh", refreshToken);

        expect(statusCode).toBe(204);

        // session should now be invalid
        const { body } = await supertest(app)
          .get("/api/sessions")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(body).toHaveLength(0);
      });
    });
  });
});
