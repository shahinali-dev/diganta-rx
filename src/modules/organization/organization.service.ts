import { Role } from "@prisma/client";
import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import prisma from "../../lib/prisma";
import QueryBuilder from "../../utils/query_builder";
import { IOrganization } from "./organization.interface";

export const organizationSelect = {
  id: true,
  name: true,
  logo: true,
  companySize: true,
  defaultCurrency: true,
  fiscalYearStart: true,
  primaryTimezone: true,
  industryId: true,
  industry: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { users: true },
  },
};

export class OrganizationService {
  private async assertIndustryExists(industryId: string) {
    const industry = await prisma.industry.findUnique({
      where: { id: industryId },
    });

    if (!industry) {
      throw new AppError(httpStatus.NOT_FOUND, "Industry not found");
    }
  }

  // Platform ADMIN can act on any organization. An ORG_ADMIN may only act
  // on the one organization they belong to.
  private async assertOrganizationOwnership(
    userId: string,
    role: Role | undefined,
    organizationId: string,
  ) {
    if (role === Role.ADMIN) return;

    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (
      !requester?.organizationId ||
      requester.organizationId !== organizationId
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only manage your own organization",
      );
    }
  }

  async createOrganization(
    userId: string,
    role: Role | undefined,
    data: IOrganization,
  ) {
    if (data.industryId) {
      await this.assertIndustryExists(data.industryId);
    }

    // Platform ADMIN can provision organizations freely (e.g. onboarding a
    // new client) without being tied to them. An ORG_ADMIN is limited to
    // exactly one organization - the one they own and run.
    if (role !== Role.ADMIN) {
      const requester = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (requester?.organizationId) {
        throw new AppError(
          httpStatus.CONFLICT,
          "You have already created an organization. Each org admin can own only one organization.",
        );
      }
    }

    const organization = await prisma.organization.create({
      data,
      select: organizationSelect,
    });

    // Link the creating org admin to the organization they just created,
    // so they immediately "own" and can manage it.
    if (role !== Role.ADMIN) {
      await prisma.user.update({
        where: { id: userId },
        data: { organizationId: organization.id },
      });
    }

    return organization;
  }

  async getAllOrganizations(query: Record<string, unknown>) {
    const organizationQuery = new QueryBuilder(prisma.organization, query)
      .search(["name"])
      .filter()
      .sort()
      .paginate()
      .select(organizationSelect);

    const result = await organizationQuery.execute();
    const meta = await organizationQuery.countTotal();

    return { meta, result };
  }

  async getOrganizationById(id: string) {
    const organization = await prisma.organization.findUnique({
      where: { id },
      select: organizationSelect,
    });

    if (!organization) {
      throw new AppError(httpStatus.NOT_FOUND, "Organization not found");
    }

    return organization;
  }

  // Resolves the caller's own organizationId, or throws if they don't
  // belong to one yet. Used by every "/my" endpoint so an ORG_ADMIN never
  // has to know or pass their organization's id.
  private async resolveMyOrganizationId(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "No organization is assigned to this account",
      );
    }

    return user.organizationId;
  }

  async getMyOrganization(userId: string) {
    const organizationId = await this.resolveMyOrganizationId(userId);
    return this.getOrganizationById(organizationId);
  }

  async updateMyOrganization(userId: string, data: Partial<IOrganization>) {
    const organizationId = await this.resolveMyOrganizationId(userId);

    if (data.industryId) {
      await this.assertIndustryExists(data.industryId);
    }

    return prisma.organization.update({
      where: { id: organizationId },
      data,
      select: organizationSelect,
    });
  }

  async deleteMyOrganization(userId: string) {
    const organizationId = await this.resolveMyOrganizationId(userId);

    const otherMemberCount = await prisma.user.count({
      where: { organizationId, id: { not: userId } },
    });

    if (otherMemberCount > 0) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Cannot delete an organization that still has other members assigned to it",
      );
    }

    await prisma.organization.delete({ where: { id: organizationId } });
    return null;
  }

  // Admin-only, id-based variants (see /: id routes) - platform ADMIN
  // manages any tenant organization directly by id.
  async updateOrganization(
    id: string,
    data: Partial<IOrganization>,
    userId: string,
    role: Role | undefined,
  ) {
    await this.assertOrganizationOwnership(userId, role, id);
    await this.getOrganizationById(id);

    if (data.industryId) {
      await this.assertIndustryExists(data.industryId);
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data,
      select: organizationSelect,
    });

    return updatedOrganization;
  }

  async deleteOrganization(id: string, userId: string, role: Role | undefined) {
    await this.assertOrganizationOwnership(userId, role, id);
    await this.getOrganizationById(id);

    // Exclude the requester themselves - an org admin is always a member
    // of their own organization, so without this every self-delete would
    // be blocked by their own membership.
    const otherMemberCount = await prisma.user.count({
      where: { organizationId: id, id: { not: userId } },
    });

    if (otherMemberCount > 0) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Cannot delete an organization that still has other members assigned to it",
      );
    }

    await prisma.organization.delete({ where: { id } });

    return null;
  }
}

export const organizationService = new OrganizationService();
