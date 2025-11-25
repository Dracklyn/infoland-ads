import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image from buffer (used with multer memory storage)
export async function uploadImageFromBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'infoland-ads',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          {
            width: 1200,
            height: 1200,
            crop: 'limit',
            quality: 'auto',
          },
        ],
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

// Delete image from Cloudinary
export async function deleteImage(imageUrl) {
  try {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{format}
    if (!imageUrl || !isCloudinaryUrl(imageUrl)) {
      // Not a Cloudinary URL, might be local file or already deleted
      return { result: 'ok' };
    }

    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) {
      return { result: 'ok' };
    }

    // Get the path after 'upload'
    const pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
    // Remove file extension
    const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Don't throw error, just log it (image might already be deleted or not exist)
    return { result: 'ok' };
  }
}

// Check if URL is a Cloudinary URL
export function isCloudinaryUrl(url) {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

export { cloudinary };
