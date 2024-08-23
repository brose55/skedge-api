import jwt from 'jsonwebtoken'
import config from 'config'

const privateKey = config.get<string>('privateKey')
const publicKey = config.get<string>('publicKey')

export function signJwt(
  object: Object,
  options?: jwt.SignOptions | undefined
) {
  return jwt.sign(object, privateKey, {
    // check to see if options isn't undefined before spreading it
    ...(options && options),
    algorithm: 'RS256'
  })
}

export function verifyJwt(token: string) {
  try {
    const decoded = jwt.verify(token, publicKey)
    return {
      valid: true,
      expired: false,
      decoded: decoded
    };
    
  } catch (err: any) {
    return {
      valid: false,
      expired: err.message = 'jwt expired',
      decoded: null
    }
  }
}