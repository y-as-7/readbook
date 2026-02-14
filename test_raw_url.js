const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const publicId = 'ai8udkceao0kaetckv0k'; 
const version = '1771110878';

// Generate raw URL
const rawUrl = cloudinary.url(publicId, {
    resource_type: "raw", // Try raw instead of image
    type: "upload",
    sign_url: true,
    secure: true,
    version: version
});

console.log('Raw Signed URL:', rawUrl);

// Generate image URL with no format
const noFormatUrl = cloudinary.url(publicId, {
    resource_type: "image",
    // format: "pdf", // Omit format
    type: "upload",
    sign_url: true,
    secure: true,
    version: version
});
console.log('No Format URL:', noFormatUrl);
