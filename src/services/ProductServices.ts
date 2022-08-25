import { Omit } from "lodash";
import {
	DocumentDefinition,
	FilterQuery,
	QueryOptions,
	UpdateQuery,
} from "mongoose";
import IProductModel from "../interfaces/IProductModel";
import ProductModel from "../models/ProductModel";

export async function createProduct(
	input: DocumentDefinition<Omit<IProductModel, "createdAt" | "updatedAt" | "productId">>
) {
	return ProductModel.create(input);
}

export async function findProduct(
	query: FilterQuery<IProductModel>,
	options: QueryOptions = { lean: true }
) {
	return ProductModel.findOne(query, {}, options);
}

export async function findAndUpdateProduct(
	query: FilterQuery<IProductModel>,
	update: UpdateQuery<IProductModel>,
	options: QueryOptions
) {
  return ProductModel.findOneAndUpdate(query, update, options)
}

export async function deleteProduct(query: FilterQuery<IProductModel>) {
  return ProductModel.deleteOne(query)
}
