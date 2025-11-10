import { Request, Response } from "express";
import { Op } from "sequelize";
import asyncHandler from "../utils/asyncHandler";
import { Hotel, Room, Review, HotelImage, Amenity, User } from "../models";
import { getPagination, formatPaginationResponse } from "../utils/helpers";
import * as cloudinaryService from "../services/cloudinaryService";
import {
  CreateHotelRequest,
  UpdateHotelRequest,
  HotelSearchQuery,
} from "../types";

export const getHotels = asyncHandler(
  async (
    req: Request<{}, {}, {}, HotelSearchQuery>,
    res: Response
  ): Promise<void> => {
    const {
      page = "1",
      limit = "10",
      city,
      country,
      min_price,
      max_price,
      star_rating,
      amenities,
      search,
    } = req.query;

    const where: any = { is_active: true };

    if (city) {
      where.city = { [Op.iLike]: `%${city}%` };
    }

    if (country) {
      where.country = { [Op.iLike]: `%${country}%` };
    }

    if (star_rating) {
      where.star_rating = parseInt(star_rating);
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const include: any[] = [
      {
        model: Room,
        as: "rooms",
        attributes: ["id", "room_type", "price_per_night", "capacity"],
        where: {},
        required: false,
      },
      {
        model: HotelImage,
        as: "images",
        attributes: ["id", "url", "is_primary"],
        limit: 5,
      },
      {
        model: Amenity,
        as: "amenities",
        attributes: ["id", "name", "category"],
        through: { attributes: [] },
      },
    ];

    if (min_price || max_price) {
      include[0].where.price_per_night = {};

      if (min_price) {
        include[0].where.price_per_night[Op.gte] = parseFloat(min_price);
      }

      if (max_price) {
        include[0].where.price_per_night[Op.lte] = parseFloat(max_price);
      }

      include[0].required = true;
    }

    if (amenities) {
      const amenityIds = amenities.split(",");
      include[2].where = { id: { [Op.in]: amenityIds } };
      include[2].required = true;
    }

    const { limit: limitNum, offset } = getPagination(
      parseInt(page),
      parseInt(limit)
    );

    const { count, rows } = await Hotel.findAndCountAll({
      where,
      include,
      limit: limitNum,
      offset,
      distinct: true,
      order: [
        ["featured", "DESC"],
        ["average_rating", "DESC"],
      ],
    });

    res.status(200).json({
      success: true,
      ...formatPaginationResponse(rows, parseInt(page), parseInt(limit), count),
    });
  }
);

export const getHotel = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [
        {
          model: Room,
          as: "rooms",
          where: { is_available: true },
          required: false,
        },
        {
          model: HotelImage,
          as: "images",
          separate: true,
          order: [
            ["is_primary", "DESC"],
            ["display_order", "ASC"],
          ],
        },
        {
          model: Amenity,
          as: "amenities",
          through: { attributes: [] },
        },
        {
          model: Review,
          as: "reviews",
          limit: 10,
          separate: true,
          order: [["created_at", "DESC"]],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "first_name", "last_name", "profile_picture"],
            },
          ],
        },
      ],
    });

    if (!hotel) {
      res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: hotel,
    });
  }
);

export const createHotel = asyncHandler(
  async (
    req: Request<{}, {}, CreateHotelRequest>,
    res: Response
  ): Promise<void> => {
    const hotelData = req.body;

    const hotel = await Hotel.create(hotelData);

    if (req.body.amenity_ids && req.body.amenity_ids.length > 0) {
      const amenities = await Amenity.findAll({
        where: { id: { [Op.in]: req.body.amenity_ids } },
      });
      await hotel.setAmenities(amenities);
    }

    const createdHotel = await Hotel.findByPk(hotel.id, {
      include: [
        { model: Amenity, as: "amenities", through: { attributes: [] } },
      ],
    });

    res.status(201).json({
      success: true,
      data: createdHotel,
    });
  }
);

export const updateHotel = asyncHandler(
  async (
    req: Request<{ id: string }, {}, UpdateHotelRequest>,
    res: Response
  ): Promise<void> => {
    let hotel = await Hotel.findByPk(req.params.id);

    if (!hotel) {
      res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
      return;
    }

    await hotel.update(req.body);

    if (req.body.amenity_ids) {
      const amenities = await Amenity.findAll({
        where: { id: { [Op.in]: req.body.amenity_ids } },
      });
      await hotel.setAmenities(amenities);
    }

    hotel = (await Hotel.findByPk(hotel.id, {
      include: [
        { model: Room, as: "rooms" },
        { model: HotelImage, as: "images" },
        { model: Amenity, as: "amenities", through: { attributes: [] } },
      ],
    })) as Hotel;

    res.status(200).json({
      success: true,
      data: hotel,
    });
  }
);

export const deleteHotel = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [{ model: HotelImage, as: "images" }],
    });

    if (!hotel) {
      res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
      return;
    }

    const hotelWithImages = hotel as Hotel & { images: any[] };

    if (hotelWithImages.images && hotelWithImages.images.length > 0) {
      const publicIds = hotelWithImages.images
        .filter((img) => img.public_id)
        .map((img) => img.public_id);

      if (publicIds.length > 0) {
        await cloudinaryService.deleteMultipleImages(publicIds);
      }
    }

    await hotel.destroy();

    res.status(200).json({
      success: true,
      message: "Hotel deleted successfully",
    });
  }
);

export const uploadHotelImages = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const hotel = await Hotel.findByPk(req.params.id);

    if (!hotel) {
      res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
      return;
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      res.status(400).json({
        success: false,
        message: "Please upload at least one image",
      });
      return;
    }

    const uploadedImages = await cloudinaryService.uploadMultipleImages(
      req.files as Express.Multer.File[],
      `hotels/${hotel.id}`
    );

    const imageRecords = uploadedImages.map((img, index) => ({
      hotel_id: hotel.id,
      url: img.url,
      public_id: img.public_id,
      is_primary: index === 0 && req.body.set_first_as_primary === "true",
      display_order: index,
    }));

    const images = await HotelImage.bulkCreate(imageRecords);

    res.status(200).json({
      success: true,
      data: images,
    });
  }
);

export const deleteHotelImage = asyncHandler(
  async (
    req: Request<{ hotelId: string; imageId: string }>,
    res: Response
  ): Promise<void> => {
    const image = await HotelImage.findOne({
      where: {
        id: req.params.imageId,
        hotel_id: req.params.hotelId,
      },
    });

    if (!image) {
      res.status(404).json({
        success: false,
        message: "Image not found",
      });
      return;
    }

    if (image.public_id) {
      await cloudinaryService.deleteImage(image.public_id);
    }

    await image.destroy();

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  }
);

export const getFeaturedHotels = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const hotels = await Hotel.findAll({
      where: {
        is_active: true,
        featured: true,
      },
      include: [
        {
          model: HotelImage,
          as: "images",
          where: { is_primary: true },
          required: false,
          limit: 1,
        },
      ],
      limit: 10,
      order: [["average_rating", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: hotels,
    });
  }
);
