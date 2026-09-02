type PrismaDelegate<T> = {
  findMany: (args: any) => Promise<T[]>;
  count: (args: any) => Promise<number>;
};

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

class QueryBuilder<T> {
  private delegate: PrismaDelegate<T>;
  private query: Record<string, unknown>;
  private baseWhere: Record<string, any>;

  private andConditions: Record<string, any>[] = [];
  private orderByObj: Record<string, "asc" | "desc"> = {};
  private skipVal = 0;
  private takeVal: number | undefined;
  private selectObj: Record<string, boolean> | undefined;
  private includeObj: Record<string, any> | undefined;

  constructor(
    delegate: PrismaDelegate<T>,
    query: Record<string, unknown>,
    baseWhere: Record<string, any> = {},
  ) {
    this.delegate = delegate;
    this.query = query;
    this.baseWhere = baseWhere;
    if (Object.keys(baseWhere).length > 0) {
      this.andConditions.push(baseWhere);
    }
  }

  // Search functionality
  search(searchableFields: string[]) {
    const searchTerm = this.query?.searchTerm as string | undefined;
    if (searchTerm?.trim()) {
      this.andConditions.push({
        OR: searchableFields.map((field) => ({
          [field]: { contains: searchTerm.trim(), mode: "insensitive" },
        })),
      });
    }
    return this;
  }

  // Filter functionality
  filter() {
    const queryObj = { ...this.query };
    const excludeFields = [
      "searchTerm",
      "sortBy",
      "sortOrder",
      "page",
      "limit",
      "fields",
    ];
    excludeFields.forEach((el) => delete queryObj[el]);

    Object.entries(queryObj).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        this.andConditions.push({ [key]: this.coerceValue(String(value)) });
      }
    });
    return this;
  }

  // Sort functionality
  sort() {
    const sortBy = (this.query?.sortBy as string) || "createdAt";
    const sortOrder = this.query?.sortOrder === "asc" ? "asc" : "desc";
    this.orderByObj = { [sortBy]: sortOrder };
    return this;
  }

  // Pagination functionality
  paginate() {
    const page = Number(this.query?.page) || 1;
    const limit = Number(this.query?.limit) || 10;
    this.skipVal = (page - 1) * limit;
    this.takeVal = limit;
    return this;
  }

  // Fields limiting (Prisma: select object, Mongoose "-__v" string style na)
  fields(availableFields?: string[]) {
    const fieldsParam = this.query?.fields as string | undefined;
    if (fieldsParam && availableFields) {
      const requested = fieldsParam.split(",").map((f) => f.trim());
      this.selectObj = availableFields.reduce(
        (acc, field) => {
          acc[field] = requested.includes(field);
          return acc;
        },
        {} as Record<string, boolean>,
      );
    }
    return this;
  }

  include(include: Record<string, any>) {
    this.includeObj = include;
    return this;
  }

  select(select: Record<string, boolean>) {
    this.selectObj = select;
    return this;
  }

  private coerceValue(value: string): any {
    if (value === "true") return true;
    if (value === "false") return false;
    if (!isNaN(Number(value)) && value.trim() !== "") return Number(value);
    return value;
  }

  private buildWhere() {
    return this.andConditions.length > 0 ? { AND: this.andConditions } : {};
  }

  // Execute the query
  async execute(): Promise<T[]> {
    const where = this.buildWhere();
    const args: Record<string, any> = { where, orderBy: this.orderByObj };

    if (this.selectObj) args.select = this.selectObj;
    else if (this.includeObj) args.include = this.includeObj;

    if (this.takeVal !== undefined) {
      args.skip = this.skipVal;
      args.take = this.takeVal;
    }

    return this.delegate.findMany(args);
  }

  // Count total with enhanced meta
  async countTotal(): Promise<PaginationMeta> {
    const where = this.buildWhere();
    const total = await this.delegate.count({ where });

    const page = Number(this.query?.page) || 1;
    const limit = Number(this.query?.limit) || 10;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    };
  }
}

export default QueryBuilder;
