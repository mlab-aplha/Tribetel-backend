export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
export class PaginationHelper {
   
  static calculatePagination(options: PaginationOptions): {
    offset: number;
    limit: number;
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
  } {
    const { page, limit, sortBy = 'created_at', sortOrder = 'DESC' } = options;
    
    const offset = (page - 1) * limit;
    
    return {
      offset,
      limit,
      sortBy,
      sortOrder,
    };
  }
   
  static createPaginationResult<T>(
    data: T[],
    totalItems: number,
    options: PaginationOptions
  ): PaginationResult<T> {
    const { page, limit } = options;
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
   
  static validateOptions(options: Partial<PaginationOptions>): {
    isValid: boolean;
    errors: string[];
    validatedOptions: PaginationOptions;
  } {
    const errors: string[] = [];
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(Math.max(1, options.limit || 10), 100);
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'DESC';

    if (page < 1) errors.push('Page must be at least 1');
    if (limit < 1) errors.push('Limit must be at least 1');
    if (limit > 100) errors.push('Limit cannot exceed 100');
    if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
      errors.push('Sort order must be ASC or DESC');
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedOptions: { page, limit, sortBy, sortOrder },
    };
  }

  
  static getDefaultOptions(): PaginationOptions {
    return {
      page: 1,
      limit: 10,
      sortBy: 'created_at',
      sortOrder: 'DESC',
    };
  }

  
  static generateOrderByClause(sortBy: string, sortOrder: 'ASC' | 'DESC'): string {
    return `${sortBy} ${sortOrder}`;
  }
}

export default PaginationHelper;
