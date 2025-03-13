// src/lib/tokens.ts
import { randomBytes } from 'crypto'
import { hashSync } from 'bcryptjs'

export const generateAdminToken = () => {
  const token = randomBytes(32).toString('hex') // 64-character random string
  const tokenHash = hashSync(token, 12)
  return { token, tokenHash }
}