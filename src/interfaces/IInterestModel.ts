import mongoose from "mongoose";
import IUserModel from "./IUserModel";

// type for the Interest Model
interface IInterestModel extends mongoose.Document {
	user: IUserModel["_id"];
	value: string;
	priority: string;
	weight: number;
}

export default IInterestModel;
