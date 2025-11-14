import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { Amenity } from "../models";
import { CreateAmenityRequest, UpdateAmenityRequest } from "../types";

export const getAmenities = asyncHandler(
  async (
    req: Request<{}, {}, {}, { category?: string }>,
    res: Response
  ): Promise<void> => {
    const { category } = req.query;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    const amenities = await Amenity.findAll({
      where,
      order: [
        ["category", "ASC"],
        ["name", "ASC"],
      ],
    });

    const groupedAmenities = amenities.reduce(
      (acc, amenity) => {
        if (!acc[amenity.category]) {
          acc[amenity.category] = [];
        }
        acc[amenity.category].push(amenity);
        return acc;
      },
      {} as Record<string, typeof amenities>
    );

    res.status(200).json({
      success: true,
      data: amenities,
      grouped: groupedAmenities,
    });
  }
);

export const createAmenity = asyncHandler(
  async (
    req: Request<{}, {}, CreateAmenityRequest>,
    res: Response
  ): Promise<void> => {
    const amenity = await Amenity.create(req.body);

    res.status(201).json({
      success: true,
      data: amenity,
    });
  }
);

export const updateAmenity = asyncHandler(
  async (
    req: Request<{ id: string }, {}, UpdateAmenityRequest>,
    res: Response
  ): Promise<void> => {
    let amenity = await Amenity.findByPk(req.params.id);

    if (!amenity) {
      res.status(404).json({
        success: false,
        message: "Amenity not found",
      });
      return;
    }

    amenity = await amenity.update(req.body);

    res.status(200).json({
      success: true,
      data: amenity,
    });
  }
);

export const deleteAmenity = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const amenity = await Amenity.findByPk(req.params.id);

    if (!amenity) {
      res.status(404).json({
        success: false,
        message: "Amenity not found",
      });
      return;
    }

    await amenity.destroy();

    res.status(200).json({
      success: true,
      message: "Amenity deleted successfully",
    });
  }
);
