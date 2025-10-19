import pool from '../config/database';

export interface SearchFilters {
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
  amenities?: string[];
  checkIn?: string;
  checkOut?: string;
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'rating' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SearchResult {
  rooms: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: SearchFilters;
}

export class SearchService {
  
  static async searchRooms(
    query: string = '',
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'price_per_night',
        sortOrder = 'ASC'
      } = options;

      const offset = (page - 1) * limit;

       
      const conditions: string[] = ['r.status = $1'];
      const params: any[] = ['available'];
      let paramCount = 1;

      
      if (query) {
        paramCount++;
        conditions.push(`(
          r.room_number ILIKE $${paramCount} OR 
          r.room_type ILIKE $${paramCount} OR
          r.description ILIKE $${paramCount}
        )`);
        params.push(`%${query}%`);
      }
 
      if (filters.roomType) {
        paramCount++;
        conditions.push(`r.room_type = $${paramCount}`);
        params.push(filters.roomType);
      }

       
      if (filters.minPrice !== undefined) {
        paramCount++;
        conditions.push(`r.price_per_night >= $${paramCount}`);
        params.push(filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        paramCount++;
        conditions.push(`r.price_per_night <= $${paramCount}`);
        params.push(filters.maxPrice);
      }

       
      if (filters.capacity) {
        paramCount++;
        conditions.push(`r.capacity >= $${paramCount}`);
        params.push(filters.capacity);
      }

       
      if (filters.amenities && filters.amenities.length > 0) {
        paramCount++;
        conditions.push(`r.amenities ?| $${paramCount}`);
        params.push(filters.amenities);
      }

       
      if (filters.checkIn && filters.checkOut) {
        paramCount += 2;
        conditions.push(`NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.room_id = r.id
          AND b.status IN ('confirmed', 'checked_in')
          AND (
            (b.check_in <= $${paramCount - 1} AND b.check_out >= $${paramCount - 1}) OR
            (b.check_in <= $${paramCount} AND b.check_out >= $${paramCount}) OR
            (b.check_in >= $${paramCount - 1} AND b.check_out <= $${paramCount})
          )
        )`);
        params.push(filters.checkIn, filters.checkOut);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

       
      const orderBy = this.getSortField(sortBy);
      const orderClause = `ORDER BY ${orderBy} ${sortOrder}`;

       
      const countQuery = `SELECT COUNT(*) FROM rooms r ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

       
      const dataQuery = `
        SELECT 
          r.*,
          COALESCE(AVG(rev.rating), 0) as average_rating,
          COUNT(rev.id) as review_count
        FROM rooms r
        LEFT JOIN reviews rev ON r.id = rev.room_id
        ${whereClause}
        GROUP BY r.id
        ${orderClause}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      const dataParams = [...params, limit, offset];
      const dataResult = await pool.query(dataQuery, dataParams);

      return {
        rooms: dataResult.rows,
        total: total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total / limit),
        filters: filters
      };
    } catch (error) {
      console.error('Search rooms error:', error);
      throw new Error('Search failed');
    }
  }

   
  static async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const searchQuery = `
        SELECT 
          room_type as suggestion,
          COUNT(*) as count
        FROM rooms 
        WHERE room_type ILIKE $1
        GROUP BY room_type
        UNION
        SELECT 
          'Room ' || room_number as suggestion,
          1 as count
        FROM rooms 
        WHERE room_number ILIKE $1
        ORDER BY count DESC
        LIMIT 10
      `;

      const result = await pool.query(searchQuery, [`%${query}%`]);
      return result.rows.map(row => row.suggestion);
    } catch (error) {
      console.error('Get search suggestions error:', error);
      return [];
    }
  }

   
  static async getPopularSearches(limit: number = 10): Promise<Array<{ term: string; count: number }>> {
    try {
       
      const popularSearches = [
        { term: 'deluxe room', count: 45 },
        { term: 'suite', count: 32 },
        { term: 'beach view', count: 28 },
        { term: 'family room', count: 25 },
        { term: 'executive', count: 22 },
        { term: 'pool access', count: 18 },
        { term: 'ocean view', count: 15 },
        { term: 'standard room', count: 12 },
        { term: 'honeymoon suite', count: 10 },
        { term: 'business room', count: 8 }
      ];

      return popularSearches.slice(0, limit);
    } catch (error) {
      console.error('Get popular searches error:', error);
      return [];
    }
  }

  
  static async getSearchFilters(): Promise<any> {
    try {
       
      const roomTypesQuery = `
        SELECT 
          room_type,
          COUNT(*) as count,
          MIN(price_per_night) as min_price,
          MAX(price_per_night) as max_price
        FROM rooms 
        WHERE status = 'available'
        GROUP BY room_type
        ORDER BY count DESC
      `;

      const roomTypesResult = await pool.query(roomTypesQuery);

       
      const priceRangeQuery = `
        SELECT 
          MIN(price_per_night) as min_price,
          MAX(price_per_night) as max_price
        FROM rooms 
        WHERE status = 'available'
      `;

      const priceRangeResult = await pool.query(priceRangeQuery);

       
      const amenitiesQuery = `
        SELECT 
          jsonb_object_keys(amenities) as amenity,
          COUNT(*) as count
        FROM rooms 
        WHERE amenities IS NOT NULL 
        AND status = 'available'
        GROUP BY amenity
        ORDER BY count DESC
        LIMIT 20
      `;

      const amenitiesResult = await pool.query(amenitiesQuery);

      return {
        roomTypes: roomTypesResult.rows,
        priceRange: priceRangeResult.rows[0],
        amenities: amenitiesResult.rows,
        capacities: [1, 2, 3, 4, 5, 6]
      };
    } catch (error) {
      console.error('Get search filters error:', error);
      throw new Error('Failed to get search filters');
    }
  }

   
  static async trackSearch(query: string, filters: SearchFilters, resultsCount: number): Promise<void> {
    try {
      
      console.log('Search tracked:', {
        query: query,
        filters: filters,
        resultsCount: resultsCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Track search error:', error);
       
    }
  }

   
  private static getSortField(sortBy: string): string {
    const sortMap: Record<string, string> = {
      'price': 'r.price_per_night',
      'rating': 'average_rating',
      'created_at': 'r.created_at',
      'popularity': 'review_count'
    };

    return sortMap[sortBy] || 'r.price_per_night';
  }

   
  static validateFilters(filters: SearchFilters): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (filters.minPrice !== undefined && filters.minPrice < 0) {
      errors.push('Minimum price cannot be negative');
    }

    if (filters.maxPrice !== undefined && filters.maxPrice < 0) {
      errors.push('Maximum price cannot be negative');
    }

    if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
      errors.push('Minimum price cannot be greater than maximum price');
    }

    if (filters.capacity !== undefined && filters.capacity < 1) {
      errors.push('Capacity must be at least 1');
    }

    if (filters.checkIn && filters.checkOut) {
      const checkIn = new Date(filters.checkIn);
      const checkOut = new Date(filters.checkOut);
      
      if (checkOut <= checkIn) {
        errors.push('Check-out date must be after check-in date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

export default SearchService;
