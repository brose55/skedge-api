// src/models/user.types.ts
import type { HydratedDocument, Model } from "mongoose";
import type { AuthResult } from "@/types/user.dto";

export type User = {
  _id: string;
  username: string;
  email: string;
  password: string;
  passwordVersion: number;
  createdAt: Date;
  updatedAt: Date;
};

export interface UserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface UserStatics {
  authenticate(email: string, password: string): Promise<AuthResult>;
}

export type UserDoc = HydratedDocument<User, UserMethods>;
// Statics are added this way so the compiler knows about them
export type UserModelType = Model<User, {}, UserMethods> & UserStatics;
