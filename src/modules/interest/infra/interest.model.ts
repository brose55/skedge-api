import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import type { Interest, InterestModelType } from "./interest.types";

const interestSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    userId: { type: String, ref: "User", required: true },
    name: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
  },
  { timestamps: true }
);

// our actual Interest Model
const InterestModel = mongoose.model<Interest, InterestModelType>(
  "Interest",
  interestSchema
);

export default InterestModel;
