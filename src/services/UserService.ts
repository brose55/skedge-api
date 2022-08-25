import { omit } from "lodash";
import { DocumentDefinition, FilterQuery } from "mongoose";
import IUserModel from "../interfaces/IUserModel";
import UserModel from "../models/UserModel";

export async function createUser(
	input: DocumentDefinition<
		Omit<IUserModel, "createdAt" | "updatedAt" | "comparePassword">
	>
) {
	try {
		const user = await UserModel.create(input);
		return omit(user.toJSON(), ["password"]);
	} catch (err: any) {
		throw new Error(err);
	}
}

// check password, if correct return user object else return false
export async function validatePassword({
	email,
	password
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

	return omit(user.toJSON(), ['password']);
}

export async function findUser(query: FilterQuery<IUserModel>) {
	return UserModel.findOne(query).lean()
}
