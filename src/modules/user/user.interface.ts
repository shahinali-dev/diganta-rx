import { Provider, Role } from "./user.enum";

export interface IUser {
  name: string;
  email: string;
  role: Role;
  password: string;
  avatar?: string;
  isVerified: boolean;
  provider: Provider;
}

export interface ISignIn {
  email: string;
  password: string;
}
