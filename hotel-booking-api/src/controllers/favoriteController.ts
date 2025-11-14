import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { Favorite, Hotel, HotelImage, Room } from '../models';
import { getPagination, formatPaginationResponse } from '../utils/helpers';
import { AddFavoriteRequest } from '../types';

export const addFavorite = asyncHandler(async (req: Request<{}, {}, AddFavoriteRequest>, res: Response): Promise<void> => {
  const { hotel_id } = req.body;

  const hotel = await Hotel.findByPk(hotel_id);

  if (!hotel) {
    res.status(404).json({
      success: false,
      message: 'Hotel not found'
    });
    return;
  }

  const existingFavorite = await Favorite.findOne({
    where: {
      user_id: req.user!.id,
      hotel_id
    }
  });

  if (existingFavorite) {
    res.status(400).json({
      success: false,
      message: 'Hotel already in favorites'
    });
    return;
  }

  const favorite = await Favorite.create({
    user_id: req.user!.id,
    hotel_id
  });

  const completeFavorite = await Favorite.findByPk(favorite.id, {
    include: [
      {
        model: Hotel,
        as: 'hotel',
        include: [
          {
            model: HotelImage,
            as: 'images',
            where: { is_primary: true },
            required: false,
            limit: 1
          }
        ]
      }
    ]
  });

  res.status(201).json({
    success: true,
    data: completeFavorite
  });
});

export const getFavorites = asyncHandler(async (req: Request<{}, {}, {}, { page?: string; limit?: string }>, res: Response): Promise<void> => {
  const { page = '1', limit = '10' } = req.query;

  const { limit: limitNum, offset } = getPagination(parseInt(page), parseInt(limit));

  const { count, rows } = await Favorite.findAndCountAll({
    where: { user_id: req.user!.id },
    include: [
      {
        model: Hotel,
        as: 'hotel',
        include: [
          {
            model: HotelImage,
            as: 'images',
            where: { is_primary: true },
            required: false,
            limit: 1
          },
          {
            model: Room,
            as: 'rooms',
            attributes: ['id', 'price_per_night'],
            limit: 1,
            separate: true,
            order: [['price_per_night', 'ASC']]
          }
        ]
      }
    ],
    limit: limitNum,
    offset,
    order: [['created_at', 'DESC']]
  });

  res.status(200).json({
    success: true,
    ...formatPaginationResponse(rows, parseInt(page), parseInt(limit), count)
  });
});

export const removeFavorite = asyncHandler(async (req: Request<{ hotelId: string }>, res: Response): Promise<void> => {
  const favorite = await Favorite.findOne({
    where: {
      user_id: req.user!.id,
      hotel_id: req.params.hotelId
    }
  });

  if (!favorite) {
    res.status(404).json({
      success: false,
      message: 'Favorite not found'
    });
    return;
  }

  await favorite.destroy();

  res.status(200).json({
    success: true,
    message: 'Hotel removed from favorites'
  });
});

export const checkFavorite = asyncHandler(async (req: Request<{ hotelId: string }>, res: Response): Promise<void> => {
  const favorite = await Favorite.findOne({
    where: {
      user_id: req.user!.id,
      hotel_id: req.params.hotelId
    }
  });

  res.status(200).json({
    success: true,
    data: { is_favorited: !!favorite }
  });
});