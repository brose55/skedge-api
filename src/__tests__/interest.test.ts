import mongoose from "mongoose";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import createServer from "../utils/server";
import { signJwt } from "../utils/jwt";

const app = createServer();

const userId = new mongoose.Types.ObjectId().toString();

const userPayload = {
	_id: userId,
	email: "jane.doe@example.com",
	username: "Jane Doe",
};

const interestsPayload = [
		{
			value: "health",
			priority: "high",
			weight: 3,
		},
		{
			value: "python",
			priority: "high",
			weight: 3,
		},
		{
			value: "reading",
			priority: "low",
			weight: 1,
		},
	]

describe("interests", () => {
	
  beforeAll(async () => {
		const mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoose.connection.close();
	});

  describe("get interests route", () => {

		describe("given the user is not logged in", () => {
			test("should return a 403", async () => {
				const { statusCode } = await supertest(app).get("/api/interests");

				expect(statusCode).toBe(403);
			});      
		});

    describe('given the user is logged in', () => {

      describe('if the user has no previous interests', () => {
        test('should return 200 and an empty array', async () => {
          const jwt = signJwt(userPayload)

          const { statusCode, body } = await supertest(app).get('/api/interests')
          .set('Authorization', `Bearer ${jwt}`)
          .send(interestsPayload)

          expect(statusCode).toBe(200)
          expect(body).toEqual([])
        })
      })

      describe('if the user has previous interests', () => {
        test('should return 200 and the previous interests', async () => {
          const jwt = signJwt(userPayload)

          await supertest(app)
						.put("/api/interests")
						.set("Authorization", `Bearer ${jwt}`)
						.send(interestsPayload);

          const { statusCode, body } = await supertest(app).get('/api/interests')
          .set('Authorization', `Bearer ${jwt}`)

          expect(statusCode).toBe(200)
          expect(body).toStrictEqual([
					{
						__v: 0,
						_id: expect.any(String),
						priority: "high",
						user: userId,
						value: "health",
						weight: 3,
					},
					{
						__v: 0,
						_id: expect.any(String),
						priority: "high",
						user: userId,
						value: "python",
						weight: 3,
					},
					{
						__v: 0,
						_id: expect.any(String),
						priority: "low",
						user: userId,
						value: "reading",
						weight: 1,
					},
				]);
        })
      })
    })
	});

  describe('update interests route', () => {
    describe('change me', () => {
      test('should create the interests, then return them', async () => {
        const jwt = signJwt(userPayload);

				const { body, statusCode } = await supertest(app)
					.put("/api/interests")
					.set("Authorization", `Bearer ${jwt}`)
					.send(interestsPayload);

				expect(statusCode).toBe(200);
        expect(body).toStrictEqual([
					{
						__v: 0,
						_id: expect.any(String),
						priority: "high",
						user: userId,
						value: "health",
						weight: 3,
					},
					{
						__v: 0,
						_id: expect.any(String),
						priority: "high",
						user: userId,
						value: "python",
						weight: 3,
					},
					{
						__v: 0,
						_id: expect.any(String),
						priority: "low",
						user: userId,
						value: "reading",
						weight: 1,
					},
				]);

      })
    })
  })

});
