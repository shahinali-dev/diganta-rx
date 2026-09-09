import { Role } from "@prisma/client";

interface IJWTPayload {
  uuid: string;
  email: string;
  role?: Role;
}

export { IJWTPayload };
