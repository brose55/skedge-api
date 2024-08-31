import mongoose from "mongoose";
import ISessionModel from "../interfaces/ISessionModel";
import { v4 as uuidv4 } from "uuid";

// basic created session schema
const sessionSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    valid: {
      type: Boolean,
      default: true,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// our actual Session Model
const SessionModel = mongoose.model<ISessionModel>("Session", sessionSchema);

export default SessionModel;
