const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const publicId = 'ai8udkceao0kaetckv0k'; 
const version = '1771110878';

// Generate signed URL as implemented in backend
const signedUrl = cloudinary.url(publicId, {
    resource_type: "image",
    format: "pdf",
    type: "upload",
    sign_url: true,
    secure: true
});

console.log('Signed URL:', signedUrl);
