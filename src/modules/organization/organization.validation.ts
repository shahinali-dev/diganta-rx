import { z } from "zod";
import { CompanySize } from "./organization.enum";

const createOrganizationValidationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  logo: z.string().optional(),
  companySize: z.nativeEnum(CompanySize).optional(),
  industryId: z.string().uuid("Invalid industry id").optional(),
  defaultCurrency: z.string().min(1).optional(),
  // coerce: create is JSON, but update runs behind multer (logo upload),
  // which delivers every field as a string in req.body.
  fiscalYearStart: z.coerce
    .number()
    .int()
    .min(1, "fiscalYearStart must be between 1 and 12")
    .max(12, "fiscalYearStart must be between 1 and 12")
    .optional(),
  primaryTimezone: z.string().min(1).optional(),
});

const updateOrganizationValidationSchema = z.object({
  name: z.string().min(1, "Organization name is required").optional(),
  logo: z.string().optional(),
  companySize: z.nativeEnum(CompanySize).optional(),
  industryId: z.string().uuid("Invalid industry id").optional(),
  defaultCurrency: z.string().min(1).optional(),
  fiscalYearStart: z.coerce
    .number()
    .int()
    .min(1, "fiscalYearStart must be between 1 and 12")
    .max(12, "fiscalYearStart must be between 1 and 12")
    .optional(),
  primaryTimezone: z.string().min(1).optional(),
});

const assignIndustryValidationSchema = z.object({
  industryId: z.string().uuid("Invalid industry id"),
});

export const organizationValidation = {
  createOrganizationValidationSchema,
  updateOrganizationValidationSchema,
  assignIndustryValidationSchema,
};
