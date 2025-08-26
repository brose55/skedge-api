import type { User } from "../user/user.types";

export type Priority = "low" | "medium" | "high";

export type Interest = {
  _id: string;
  userId: User["_id"]; // = string (uuid)
  name: string;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
};

// TODO:::: do we need to export type, import type everywhere?
