import mongoose from "mongoose"
import bcrypt from 'bcrypt'
import config from 'config'
import IUserModel from "../interfaces/IUserModel"

// basic created user schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, 'Must match an email address!']
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

// before save, encrypt the password
userSchema.pre("save",async function(next) {
  // avoiding using this directly
  let user = this as IUserModel
  if (!user.isModified) {
    return next()
  }

  // very strong encryption
  const salt = await bcrypt.genSalt(config.get<number>('saltWorkFactor'))
  const hash = await bcrypt.hashSync(user.password, salt)

  // change password to hash string
  user.password = hash

  return next()
})

// calls schema method for comparing password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  // avoiding using this directly
  const user = this as IUserModel
  return bcrypt
    .compare(candidatePassword, user.password)
    .catch(err => false)
}

// our actual User Model
const UserModel = mongoose.model<IUserModel>("User", userSchema)

export default UserModel