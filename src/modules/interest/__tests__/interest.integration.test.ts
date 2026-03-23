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

const interestsPayload = [
  { name: "health", priority: "high" },
  { name: "python", priority: "high" },
  { name: "reading", priority: "low" },
];

describe("interest routes", () => {
  let mongoServer: MongoMemoryServer;
  let accessToken: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // register and login once for the whole suite
    await supertest(app).post("/api/users").send(validUser);
    const loginRes = await supertest(app)
      .post("/api/sessions")
      .send({ email: validUser.email, password: validUser.password });

    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // only drop interests between tests, keep the user and session
    await mongoose.connection.collection("interests").deleteMany({});
  });

  describe("GET /api/interests", () => {
    describe("given the user is not logged in", () => {
      test("should return 403", async () => {
        const { statusCode } = await supertest(app).get("/api/interests");
        expect(statusCode).toBe(403);
      });
    });

    describe("given the user has no interests", () => {
      test("should return 200 and an empty array", async () => {
        const { statusCode, body } = await supertest(app)
          .get("/api/interests")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(statusCode).toBe(200);
        expect(body).toEqual([]);
      });
    });

    describe("given the user has interests", () => {
      test("should return 200 and the interests", async () => {
        await supertest(app)
          .put("/api/interests")
          .set("Authorization", `Bearer ${accessToken}`)
          .send(interestsPayload);

        const { statusCode, body } = await supertest(app)
          .get("/api/interests")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(statusCode).toBe(200);
        expect(body).toHaveLength(3);
        expect(body[0]).toMatchObject({ name: "health", priority: "high" });

        expect(body[0].__v).toBeUndefined();
        expect(body[0].password).toBeUndefined();
      });
    });
  });

  describe("PUT /api/interests", () => {
    describe("given valid interests", () => {
      test("should return 200 and upserted interests", async () => {
        const { statusCode, body } = await supertest(app)
          .put("/api/interests")
          .set("Authorization", `Bearer ${accessToken}`)
          .send(interestsPayload);
        expect(statusCode).toBe(200);
        expect(body).toHaveLength(3);
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: "health", priority: "high" }),
            expect.objectContaining({ name: "python", priority: "high" }),
            expect.objectContaining({ name: "reading", priority: "low" }),
          ]),
        );
      });
    });

    describe("given invalid input", () => {
      test("should return 400 when priority is missing", async () => {
        const { statusCode } = await supertest(app)
          .put("/api/interests")
          .set("Authorization", `Bearer ${accessToken}`)
          .send([{ name: "health" }]);

        expect(statusCode).toBe(400);
      });

      test("should return 400 when name is too long", async () => {
        const { statusCode } = await supertest(app)
          .put("/api/interests")
          .set("Authorization", `Bearer ${accessToken}`)
          .send([{ name: "a".repeat(21), priority: "high" }]);

        expect(statusCode).toBe(400);
      });
    });
  });

  describe("DELETE /api/interests/:interestId", () => {
    describe("given a valid interest id", () => {
      test("should return 200 and delete the interest", async () => {
        const { body: createdInterests } = await supertest(app)
          .put("/api/interests")
          .set("Authorization", `Bearer ${accessToken}`)
          .send(interestsPayload);

        const interestId = createdInterests[0]._id;
        console.log("interestId:", interestId); // ← is this a real id?
        console.log("accessToken:", accessToken); // ← is this still valid?

        const deleteRes = await supertest(app)
          .delete(`/api/interests/${interestId}`)
          .set("Authorization", `Bearer ${accessToken}`);

        console.log("delete status:", deleteRes.statusCode);
        console.log("delete body:", deleteRes.body); // ← what does express say?

        expect(deleteRes.statusCode).toBe(200);
      });
    });

    describe("given an interest that does not exist", () => {
      test("should return 404", async () => {
        const { statusCode } = await supertest(app)
          .delete("/api/interests/does-not-exist")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(statusCode).toBe(404);
      });
    });
  });
});
