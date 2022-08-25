import { Router } from "express";
import {
	createProductHandler,
	deleteProductHandler,
	getProductHandler,
	updateProductHandler,
} from "../../controllers/ProductController";
import requireUser from "../../middleware/requireUser";
import validateResource from "../../middleware/validateResource";
import {
	createProductSchema,
	deleteProductSchema,
	getProductSchema,
	updateProductSchema,
} from "../../schemas/ProductSchema";

const router = Router();

router
	.route("/")
	.post(
		[requireUser, validateResource(createProductSchema)],
		createProductHandler
	);

router
	.route("/:productId")
	.get(validateResource(getProductSchema), getProductHandler)
	.put(
		[requireUser, validateResource(updateProductSchema)],
		updateProductHandler
	)
	.delete(
		[requireUser, validateResource(deleteProductSchema)],
		deleteProductHandler
	);

export default router;
