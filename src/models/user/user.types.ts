export type User = {
  _id: string; // we use uuidv4(), so string is correct
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

// this syntax guarantees zero runtime imports.
export type UserDoc = import("mongoose").HydratedDocument<User, UserMethods>;
// Model type (we can add UserStatics here if needed)
export type UserModelType = import("mongoose").Model<User, {}, UserMethods>;
