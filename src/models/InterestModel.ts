import mongoose from "mongoose";
import IInterestModel from "../interfaces/IInterestModel";

const interestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  name: {
    type: String,
    required: true,
  },
  priorityLevel: {
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
