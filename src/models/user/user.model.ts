import mongoose, { Schema, HydratedDocument } from "mongoose";
import bcrypt from "bcrypt";
import config from "config";
import logger from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";
import type { User, UserMethods, UserModelType } from "./user.types";

const userSchema = new Schema<User, UserModelType, UserMethods>(
  {
    _id: { type: String, default: uuidv4 },
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/.+@.+\..+/, "Must match an email address!"],
      lowercase: true, // normalize email for consistency
      trim: true,
    },
    password: { type: String, required: true, select: false }, // hidden by default
    passwordVersion: { type: Number, default: 0, select: false }, // also not given if not needed
  },
  { timestamps: true }
);

// Pre-save
userSchema.pre(
  "save",
  async function (this: HydratedDocument<User, UserMethods>) {
    if (!this.isModified("password")) return;

    try {
      // validate work factor, to protect from bad config values
      const workFactor = Number(config.get<number | string>("saltWorkFactor"));
      if (!Number.isInteger(workFactor) || workFactor < 4 || workFactor > 20) {
        throw new Error(`Invalid saltWorkFactor: ${workFactor}`);
      }

      // encrypt the hash
      const salt = await bcrypt.genSalt(workFactor);
      this.password = await bcrypt.hash(this.password, salt);

      // bump password version whenever password changes
      this.passwordVersion = (this.passwordVersion ?? 0) + 1;
    } catch (err: unknown) {
      if (err instanceof Error) {
        logger.error(err, "Error hashing password");
      } else {
        logger.error({ err }, "Unknown error hashing password");
      }
      throw err; // ensure `save()`/`create()` rejects
    }
  }
);

userSchema.methods.comparePassword = async function (
  this: HydratedDocument<User, UserMethods>,
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err: unknown) {
    if (err instanceof Error) logger.error(err, "Error comparing password");
    else logger.error({ err }, "Unknown error comparing password");
    return false;
  }
};

// our actual User Model
const UserModel = mongoose.model<User, UserModelType>("User", userSchema);
export default UserModel;
