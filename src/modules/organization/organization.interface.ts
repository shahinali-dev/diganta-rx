import { CompanySize } from "./organization.enum";

export interface IOrganization {
  name: string;
  logo?: string;
  companySize?: CompanySize;
  industryId?: string;
  defaultCurrency?: string;
  fiscalYearStart?: number;
  primaryTimezone?: string;
}
