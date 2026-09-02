import jwt, { JwtPayload } from "jsonwebtoken";

export const verifyToken = (token: string, secret: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
};
