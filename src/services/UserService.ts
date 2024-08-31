import { omit } from "lodash";
import { FilterQuery } from "mongoose";
import IUserModel from "../interfaces/IUserModel";
import UserModel from "../models/UserModel";
import { CreateUserInput } from "../schemas/UserSchema";

// createUser function should match the shape of the body defined in Zod schema
export async function createUser(input: CreateUserInput["body"]) {
  // Strip out passwordConfirmation before saving the user
  const { passwordConfirmation, ...userData } = input;

  try {
    const user = await UserModel.create(userData);
    return omit(user.toJSON(), ["password"]);
  } catch (err: any) {
    throw new Error(err);
  }
}

// check password, if correct return user object else return false
export async function validatePassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const user = await UserModel.findOne({ email });

  if (!user) {
    return false;
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    return false;
  }

  return omit(user.toJSON(), ["password"]);
}

export async function findUser(query: FilterQuery<IUserModel>) {
  return UserModel.findOne(query).lean();
}
