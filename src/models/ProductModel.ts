import mongoose from "mongoose"
import idGen from "../utils/id_gen";


// basic created product schema
const productSchema = new mongoose.Schema(
	{
		// error with nanoid
		productId: {
			type: String,
			required: true,
			unique: true,
			default: () => `product_${idGen('abcdefghijklmnopqrstuvwxyz0123456789', 10)}`,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		price: {
			type: Number,
			required: true,
		},
		image: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

// our actual Product Model
const ProductModel = mongoose.model  ("Product", productSchema)

export default ProductModel