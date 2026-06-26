import "server-only";

import {
  v2 as cloudinary,
  type UploadApiResponse,
} from "cloudinary";

type CloudinaryUpload = {
  secureUrl: string;
  publicId: string;
};

let isConfigured = false;

function configureCloudinary() {
  if (isConfigured) {
    return;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary environment variables.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  isConfigured = true;
}

function uploadBuffer(buffer: Buffer, folder: string) {
  configureCloudinary();

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

export async function uploadImageFile(
  file: File,
  folder: string
): Promise<CloudinaryUpload> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadBuffer(buffer, folder);

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
  };
}

export async function deleteCloudinaryAssets(publicIds: string[]) {
  if (!publicIds.length) {
    return;
  }

  configureCloudinary();

  await Promise.allSettled(
    publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      })
    )
  );
}
