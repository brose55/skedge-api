import mongoose from "mongoose";
import IInterestModel from "../interfaces/IInterestModel";
import { v4 as uuidv4 } from "uuid";

const interestSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  name: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    required: true,
  },
});

// our actual Interest Model
const InterestModel = mongoose.model<IInterestModel>(
  "Interest",
  interestSchema
);

export default InterestModel;
