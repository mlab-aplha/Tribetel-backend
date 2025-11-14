import cloudinary from "../config/cloudinary";
import { Readable } from "stream";
import { CloudinaryUploadResult } from "../types";

const bufferToStream = (buffer: Buffer): Readable => {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
};

export const uploadImage = (
  buffer: Buffer,
  folder: string = "hotels"
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `hotel-booking/${folder}`,
        resource_type: "image",
        transformation: [
          { width: 1200, height: 800, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error("Upload failed"));
        }
      }
    );

    bufferToStream(buffer).pipe(uploadStream);
  });
};

export const uploadMultipleImages = async (
  files: Express.Multer.File[],
  folder: string = "hotels"
): Promise<CloudinaryUploadResult[]> => {
  const uploadPromises = files.map((file) => uploadImage(file.buffer, folder));
  return await Promise.all(uploadPromises);
};

export const deleteImage = async (publicId: string): Promise<any> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};

export const deleteMultipleImages = async (
  publicIds: string[]
): Promise<any[]> => {
  const deletePromises = publicIds.map((id) => deleteImage(id));
  return await Promise.all(deletePromises);
};
