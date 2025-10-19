import { Request, Response } from 'express';
import pool from '../config/database';

export const searchRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      check_in,
      check_out,
      adults = 1,
      children = 0,
      room_type,
      min_price,
      max_price,
      amenities,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const totalGuests = Number(adults) + Number(children);

    let query = `
      SELECT 
        r.*,
        COUNT(b.id) as active_bookings,
        EXISTS(
          SELECT 1 FROM bookings b2 
          WHERE b2.room_id = r.id 
          AND b2.status NOT IN ('cancelled', 'completed')
          AND (
            (b2.check_in <= $2 AND b2.check_out >= $1) OR
            (b2.check_in BETWEEN $1 AND $2) OR
            (b2.check_out BETWEEN $1 AND $2)
          )
        ) as is_occupied
      FROM rooms r
      LEFT JOIN bookings b ON r.id = b.room_id 
        AND b.status NOT IN ('cancelled', 'completed')
        AND (
          (b.check_in <= $2 AND b.check_out >= $1) OR
          (b.check_in BETWEEN $1 AND $2) OR
          (b.check_out BETWEEN $1 AND $2)
        )
      WHERE r.is_available = true
      AND r.capacity >= $3
    `;

    const queryParams: any[] = [check_in, check_out, totalGuests];
    let paramCount = 3;

     
    if (room_type) {
      paramCount++;
      query += ` AND r.room_type = $${paramCount}`;
      queryParams.push(room_type);
    }

    if (min_price) {
      paramCount++;
      query += ` AND r.price_per_night >= $${paramCount}`;
      queryParams.push(Number(min_price));
    }

    if (max_price) {
      paramCount++;
      query += ` AND r.price_per_night <= $${paramCount}`;
      queryParams.push(Number(max_price));
    }

    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
      paramCount++;
      query += ` AND r.amenities @> $${paramCount}::text[]`;
      queryParams.push(amenitiesArray);
    }

     
    query += `
      GROUP BY r.id
      HAVING COUNT(b.id) = 0
      ORDER BY r.price_per_night ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);

    const result = await pool.query(query, queryParams);

     
    let countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM rooms r
      WHERE r.is_available = true
      AND r.capacity >= $1
      AND NOT EXISTS(
        SELECT 1 FROM bookings b 
        WHERE b.room_id = r.id 
        AND b.status NOT IN ('cancelled', 'completed')
        AND (
          (b.check_in <= $3 AND b.check_out >= $2) OR
          (b.check_in BETWEEN $2 AND $3) OR
          (b.check_out BETWEEN $2 AND $3)
        )
      )
    `;

    const countParams: any[] = [totalGuests, check_in, check_out];
    let countParamCount = 3;

    if (room_type) {
      countParamCount++;
      countQuery += ` AND r.room_type = $${countParamCount}`;
      countParams.push(room_type);
    }

    if (min_price) {
      countParamCount++;
      countQuery += ` AND r.price_per_night >= $${countParamCount}`;
      countParams.push(Number(min_price));
    }

    if (max_price) {
      countParamCount++;
      countQuery += ` AND r.price_per_night <= $${countParamCount}`;
      countParams.push(Number(max_price));
    }

    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
      countParamCount++;
      countQuery += ` AND r.amenities @> $${countParamCount}::text[]`;
      countParams.push(amenitiesArray);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error searching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search rooms'
    });
  }
};

export const searchAvailableRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { check_in, check_out, room_id } = req.query;

    if (!check_in || !check_out) {
      res.status(400).json({
        success: false,
        message: 'Check-in and check-out dates are required'
      });
      return;
    }

    let query = `
      SELECT 
        r.*,
        EXISTS(
          SELECT 1 FROM bookings b 
          WHERE b.room_id = r.id 
          AND b.status NOT IN ('cancelled', 'completed')
          AND (
            (b.check_in <= $2 AND b.check_out >= $1) OR
            (b.check_in BETWEEN $1 AND $2) OR
            (b.check_out BETWEEN $1 AND $2)
          )
        ) as is_available
      FROM rooms r
      WHERE r.is_available = true
    `;

    const queryParams = [check_in, check_out];

    if (room_id) {
      query += ` AND r.id = $3`;
      queryParams.push(room_id);
    }

    query += ` ORDER BY r.room_number ASC`;

    const result = await pool.query(query, queryParams);

     
    const availableRooms = result.rows.filter(room => !room.is_available);

    res.json({
      success: true,
      data: availableRooms
    });
  } catch (error) {
    console.error('Error checking room availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check room availability'
    });
  }
};

export const searchBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      guest_name,
      guest_email,
      room_number,
      status,
      date_from,
      date_to,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        b.*,
        r.room_number,
        r.room_type,
        r.price_per_night,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramCount = 0;

     
    if (guest_name) {
      paramCount++;
      query += ` AND (b.guest_name ILIKE $${paramCount} OR u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount})`;
      queryParams.push(`%${guest_name}%`);
    }

    if (guest_email) {
      paramCount++;
      query += ` AND (b.guest_email ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      queryParams.push(`%${guest_email}%`);
    }

    if (room_number) {
      paramCount++;
      query += ` AND r.room_number ILIKE $${paramCount}`;
      queryParams.push(`%${room_number}%`);
    }

    if (status) {
      paramCount++;
      query += ` AND b.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (date_from) {
      paramCount++;
      query += ` AND b.check_in >= $${paramCount}`;
      queryParams.push(date_from);
    }

    if (date_to) {
      paramCount++;
      query += ` AND b.check_out <= $${paramCount}`;
      queryParams.push(date_to);
    }

     
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered_bookings`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

     
    query += ` ORDER BY b.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(Number(limit), offset);

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error searching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search bookings'
    });
  }
};

export const getRoomSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, limit = 5 } = req.query;

    if (!query || query.toString().length < 2) {
      res.json({
        success: true,
        data: []
      });
      return;
    }

    const result = await pool.query(
      `SELECT 
        id, room_number, room_type, price_per_night 
       FROM rooms 
       WHERE room_number ILIKE $1 OR room_type ILIKE $1
       AND is_available = true
       LIMIT $2`,
      [`%${query}%`, Number(limit)]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching room suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room suggestions'
    });
  }
};

export const getPopularRooms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        COUNT(b.id) as booking_count,
        COALESCE(AVG(br.rating), 0) as average_rating
      FROM rooms r
      LEFT JOIN bookings b ON r.id = b.room_id 
        AND b.created_at >= CURRENT_DATE - INTERVAL '30 days'
      LEFT JOIN reviews br ON r.id = br.room_id AND br.status = 'approved'
      WHERE r.is_available = true
      GROUP BY r.id
      ORDER BY booking_count DESC, average_rating DESC
      LIMIT 6
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching popular rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular rooms'
    });
  }
};

export const getRoomAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { room_id, month, year } = req.query;

    if (!room_id || !month || !year) {
      res.status(400).json({
        success: false,
        message: 'Room ID, month, and year are required'
      });
      return;
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);  

    const result = await pool.query(`
      SELECT 
        date_series.date,
        NOT EXISTS(
          SELECT 1 FROM bookings b 
          WHERE b.room_id = $1 
          AND b.status NOT IN ('cancelled', 'completed')
          AND date_series.date BETWEEN b.check_in AND b.check_out - INTERVAL '1 day'
        ) as is_available
      FROM generate_series($2::date, $3::date, '1 day'::interval) as date_series(date)
      ORDER BY date_series.date
    `, [room_id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching room availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room availability'
    });
  } 
};