import mongoose from 'mongoose'
import IUserModel from './IUserModel'

// type for the Session Model
interface ISessionModel extends mongoose.Document {
  user: IUserModel["_id"]
  valid: boolean
  userAgent: string
  createdAt: Date
  updatedAt: Date
}

export default ISessionModel