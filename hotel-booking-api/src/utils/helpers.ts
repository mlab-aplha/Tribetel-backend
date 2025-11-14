import crypto from "crypto";
import { PaginationInfo } from "../types";

export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const calculateNights = (checkIn: string, checkOut: string): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const calculateTotalPrice = (
  pricePerNight: number,
  nights: number,
  numberOfRooms: number
): number => {
  return pricePerNight * nights * numberOfRooms;
};

export const getPagination = (
  page: number = 1,
  limit: number = 10
): { limit: number; offset: number } => {
  const offset = (page - 1) * limit;
  return { limit: parseInt(limit.toString()), offset };
};

export const formatPaginationResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): { data: T[]; pagination: PaginationInfo } => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      currentPage: parseInt(page.toString()),
      totalPages,
      totalItems: total,
      itemsPerPage: parseInt(limit.toString()),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const sanitizeInput = (
  obj: Record<string, any>
): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      sanitized[key] = obj[key].trim();
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
};

export const datesOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean => {
  return start1 <= end2 && start2 <= end1;
};
