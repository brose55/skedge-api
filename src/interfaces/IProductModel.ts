import mongoose from "mongoose";
import IUserModel from "./IUserModel";

// type for the Product Model
interface IProductModel extends mongoose.Document {
	user: IUserModel["_id"];
	productId: string;
	title: string;
	description: string;
	price: number;
	image: string;
	createdAt: Date;
	updatedAt: Date;
}

export default IProductModel;
