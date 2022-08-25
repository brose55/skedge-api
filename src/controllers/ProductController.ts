import { Request, Response } from "express";
import {
	CreateProductInput,
	DeleteProductInput,
	ReadProductInput,
	UpdateProductInput,
} from "../schemas/ProductSchema";
import {
	createProduct,
	deleteProduct,
	findAndUpdateProduct,
	findProduct,
} from "../services/ProductServices";
import logger from "../utils/logger";

export async function createProductHandler(
	req: Request<{}, {}, CreateProductInput["body"]>,
	res: Response
) {
	const userId = res.locals.user._id;
	const body = req.body;

	// TODO: error handling everywhere
	try {
		const product = await createProduct({ ...body, user: userId });
		return res.send(product);
	} catch (err) {
		logger.error(err);
		return res.status(409).send(err);
	}
}

export async function getProductHandler(
	req: Request<ReadProductInput["params"]>,
	res: Response
) {
	const productId = req.params.productId;
	const product = await findProduct({ productId });
	
	if (!product) {
		return res.sendStatus(404);
	}

	return res.send(product);
}

export async function updateProductHandler(
	req: Request<UpdateProductInput["params"]>,
	res: Response
) {
	const userId = res.locals.user._id;
	const productId = req.params.productId;
	const update = req.body;
	const product = await findProduct({ productId });
	
	if (!product) {
		return res.status(404);
	}

	if (String(product.user) !== userId) {
		return res.status(403);
	}

	const updatedProduct = await findAndUpdateProduct({ productId }, update, {
		new: true,
	});
  
	return res.send(updatedProduct);
}

export async function deleteProductHandler(
	req: Request<DeleteProductInput["params"]>,
	res: Response
) {
	const userId = res.locals.user._id;
	const productId = req.params.productId;
	const product = await findProduct({ productId });

	if (!product) {
		return res.status(404);
	}

	if (String(product.user) !== userId) {
		return res.status(403);
	}

	await deleteProduct({ productId });

	return res.sendStatus(200);
}
