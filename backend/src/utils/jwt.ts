/**
 * JWT Utility Functions
 * Centralized JWT token generation
 */
import jwt from 'jsonwebtoken';

/**
 * Sign JWT token with proper types
 * @param payload - Data to encode in token
 * @param secret - JWT secret key
 * @param expiresIn - Token expiration time (e.g., '7d', '1h')
 * @returns Signed JWT token string
 */
export const signToken = (
  payload: object,
  secret: string,
  expiresIn: string
): string => {
  return jwt.sign(payload, secret, { expiresIn } as any);
};

/**
 * Verify JWT token
 * @param token - JWT token to verify
 * @param secret - JWT secret key
 * @returns Decoded token payload
 */
export const verifyToken = (token: string, secret: string): any => {
  return jwt.verify(token, secret);
};

