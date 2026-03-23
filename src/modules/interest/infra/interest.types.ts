import type { User } from "../../user/infra/user.types";
import type { Model } from "mongoose";
import type { Priority } from "../domain/interest.dto";

export type Interest = {
  _id: string;
  userId: User["_id"]; // = string (uuid)
  name: string;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
};

export type InterestModelType = Model<Interest>;
