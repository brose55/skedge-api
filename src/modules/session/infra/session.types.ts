import type { User } from "../../user/infra/user.types";

// type for the Session Model
export type Session = {
  _id: string;
  userId: User["_id"]; // = string (uuid)
  valid: boolean;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
};
