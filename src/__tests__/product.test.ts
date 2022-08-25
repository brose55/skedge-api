import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import supertest from "supertest";
import { createProduct } from "../services/ProductServices";
import { signJwt } from "../utils/jwt";
import createServer from "../utils/server";

const app = createServer();

const userId = new mongoose.Types.ObjectId().toString();

const productPayload = {
	user: userId,
	title: "Canon EOS 1500D DSLR Camera with 18-55mm Lens",
	description:
		"Designed for first-time DSLR owners who want impressive results straight out of the box.",
	price: 879.99,
	image: "https://i.imgur.com/QlRphfQ.jpg",
};

const userPayload = {
	_id: userId,
	email: "jane.doe@example.com",
	username: "Jane Doe",
};

describe("product", () => {

	beforeAll(async () => {
		const mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoose.connection.close();
	});

	describe("get product route", () => {

		describe("given the product does not exist", () => {
			test("should return a 404", async () => {
				const productId = "product_123";
				await supertest(app).get(`/api/products/${productId}`).expect(404);
			});
		});

		describe("given the product does exist", () => {
			test("should return a 200 and the product", async () => {
				const product = await createProduct(productPayload);
				const { body, statusCode } = await supertest(app).get(`/api/products/${product.productId}`)

					expect(statusCode).toBe(200)
					expect(body.productId).toBe(product.productId)
			});
		});
	});

	describe('create product route', () => { 
		
		describe('given the user is not logged in', () => { 
			test('should return a 403', async () => { 
				const { statusCode } = await supertest(app).post('/api/products')

				expect(statusCode).toBe(403)
			})
		})

		describe('given the user is logged in', () => { 
			test('should return a 200 and create the product', async () => { 
				const jwt = signJwt(userPayload)

				const { body, statusCode } = await supertest(app)
					.post("/api/products")
					.set('Authorization', `Bearer ${jwt}`)
					.send(productPayload)

					expect(statusCode).toBe(200)

					expect(body).toEqual({
						_id: expect.any(String),
						user: expect.any(String),
						title: "Canon EOS 1500D DSLR Camera with 18-55mm Lens",
						description:
							"Designed for first-time DSLR owners who want impressive results straight out of the box.",
						price: 879.99,
						image: "https://i.imgur.com/QlRphfQ.jpg",
						productId: expect.any(String),
						createdAt: expect.any(String),
						updatedAt: expect.any(String),
						__v: 0,
					});
				
			})
		})

	})
});
