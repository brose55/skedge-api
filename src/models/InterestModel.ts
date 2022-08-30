import mongoose from "mongoose";
import IInterestModel from "../interfaces/IInterestModel";

const interestSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	value: {
		type: String,
		required: true,
	},
	priority: {
		type: String,
		required: true,
	},
	weight: {
		type: Number,
		required: true,
	},
});

// our actual Interest Model
const InterestModel = mongoose.model<IInterestModel>("Interest", interestSchema);

export default InterestModel;
