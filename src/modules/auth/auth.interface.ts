import { Role } from "@prisma/client";

interface IJWTPayload {
  id: string;
  email: string;
  role?: Role;
  organizationId?: string | null;
}

export { IJWTPayload };
