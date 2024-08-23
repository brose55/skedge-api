import mongoose from "mongoose"
import bcrypt from "bcrypt"
import config from "config"
import IUserModel from "../interfaces/IUserModel"
import logger from "../utils/logger"

// basic created user schema
const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			match: [/.+@.+\..+/, "Must match an email address!"],
		},
		password: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	}
)

// before save, encrypt the password
userSchema.pre("save", async function (next) {
	// avoiding using this directly
	let user = this as IUserModel

	// save resources by only rehashing the password if it's been modified
	if (!user.isModified("password")) {
		return next()
	}

	// very strong encryption
	const salt = await bcrypt.genSalt(config.get<number>("saltWorkFactor"))
	const hash = await bcrypt.hash(user.password, salt)

	user.password = hash

	return next()
})

// calls schema method for comparing password
userSchema.methods.comparePassword = async function (
	candidatePassword: string
): Promise<boolean> {
	// avoiding using this directly
	const user = this as IUserModel
	return bcrypt.compare(candidatePassword, user.password).catch((err) => {
		logger.error("error comparing password", err)
		return false
	})
}

// our actual User Model
const UserModel = mongoose.model<IUserModel>("User", userSchema)

export default UserModel
