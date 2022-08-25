import mongoose from 'mongoose'

// type for the User Model
interface IUserModel extends mongoose.Document {
  username: string
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

export default IUserModel