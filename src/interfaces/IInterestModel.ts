import mongoose from "mongoose";
import IUserModel from "./IUserModel";

// type for the Interest Model
interface IInterestModel extends mongoose.Document {
  userId: IUserModel["_id"];
  name: string;
  priorityLevel: string;
}

export default IInterestModel;
