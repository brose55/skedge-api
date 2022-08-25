import mongoose from "mongoose"
import ISessionModel from "../interfaces/ISessionModel"

// basic created session schema
const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  valid: {
    type: Boolean,
    default: true,
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
})

// our actual Session Model
const SessionModel = mongoose.model<ISessionModel>("Session", sessionSchema)

export default SessionModel