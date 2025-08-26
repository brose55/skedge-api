import { Schema, model } from "mongoose";
import type { Session, SessionModelType } from "./session.types";
import { v4 as uuidv4 } from "uuid";

// basic created session schema
const sessionSchema = new Schema<Session>(
  {
    _id: { type: String, default: uuidv4 },
    userId: { type: String, ref: "User", required: true },
    valid: { type: Boolean, default: true },
    userAgent: { type: String, default: "unknown" },
  },
  { timestamps: true }
);

// our actual Session Model
const SessionModel = model<Session>("Session", sessionSchema);

export default SessionModel;
