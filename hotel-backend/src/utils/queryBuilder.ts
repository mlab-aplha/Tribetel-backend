export interface QueryFilter {
  field: string;
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'IN' | 'BETWEEN';
  value: any;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}
export class QueryBuilder {
  private table: string;
  private filters: QueryFilter[] = [];
  private sortBy: string = 'created_at';
  private sortOrder: 'ASC' | 'DESC' = 'DESC';
  private limitValue?: number;
  private offsetValue?: number;

  constructor(table: string) {
    this.table = table;
  }
  
  where(field: string, operator: QueryFilter['operator'], value: any): this {
    this.filters.push({ field, operator, value });
    return this;
  }

   
  whereEqual(field: string, value: any): this {
    return this.where(field, '=', value);
  }

   
  whereLike(field: string, value: string): this {
    return this.where(field, 'LIKE', `%${value}%`);
  }

  
  whereIn(field: string, values: any[]): this {
    return this.where(field, 'IN', values);
  }

   
  whereBetween(field: string, start: any, end: any): this {
    return this.where(field, 'BETWEEN', [start, end]);
  }
   
  orderBy(field: string, order: 'ASC' | 'DESC' = 'DESC'): this {
    this.sortBy = field;
    this.sortOrder = order;
    return this;
  }

  
  paginate(limit: number, offset: number): this {
    this.limitValue = limit;
    this.offsetValue = offset;
    return this;
  }
   
  buildSelect(): { query: string; values: any[] } {
    const values: any[] = [];
    let query = `SELECT * FROM ${this.table}`;

     
    if (this.filters.length > 0) {
      const whereClauses = this.filters.map((filter) => {
        if (filter.operator === 'IN') {
          const placeholders = (filter.value as any[]).map((_, i) => `$${values.length + i + 1}`).join(', ');
          values.push(...filter.value);
          return `${filter.field} IN (${placeholders})`;
        } else if (filter.operator === 'BETWEEN') {
          const [start, end] = filter.value as [any, any];
          values.push(start, end);
          return `${filter.field} BETWEEN $${values.length - 1} AND $${values.length}`;
        } else {
          values.push(filter.value);
          return `${filter.field} ${filter.operator} $${values.length}`;
        }
      });
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

     
    query += ` ORDER BY ${this.sortBy} ${this.sortOrder}`;

     
    if (this.limitValue !== undefined) {
      values.push(this.limitValue);
      query += ` LIMIT $${values.length}`;
    }
    if (this.offsetValue !== undefined) {
      values.push(this.offsetValue);
      query += ` OFFSET $${values.length}`;
    }

    return { query, values };
  }
   
  buildCount(): { query: string; values: any[] } {
    const values: any[] = [];
    let query = `SELECT COUNT(*) FROM ${this.table}`;

    if (this.filters.length > 0) {
      const whereClauses = this.filters.map((filter) => {
        if (filter.operator === 'IN') {
          const placeholders = (filter.value as any[]).map((_, i) => `$${values.length + i + 1}`).join(', ');
          values.push(...filter.value);
          return `${filter.field} IN (${placeholders})`;
        } else {
          values.push(filter.value);
          return `${filter.field} ${filter.operator} $${values.length}`;
        }
      });
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    return { query, values };
  }

  
  reset(): this {
    this.filters = [];
    this.sortBy = 'created_at';
    this.sortOrder = 'DESC';
    this.limitValue = undefined;
    this.offsetValue = undefined;
    return this;
  }

   
  static create(table: string, options?: QueryOptions): QueryBuilder {
    const builder = new QueryBuilder(table);
    
    if (options) {
      if (options.filters) {
        builder.filters = options.filters;
      }
      if (options.sortBy) {
        builder.sortBy = options.sortBy;
        builder.sortOrder = options.sortOrder || 'DESC';
      }
      if (options.limit !== undefined) {
        builder.limitValue = options.limit;
      }
      if (options.offset !== undefined) {
        builder.offsetValue = options.offset;
      }
    }
    
    return builder;
  }
}

export default QueryBuilder;
