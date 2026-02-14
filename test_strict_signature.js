const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const publicId = 'ai8udkceao0kaetckv0k'; 

console.log('--- Testing Signature Variations ---');

// 1. With access_mode: 'public'
const url1 = cloudinary.url(publicId, {
    resource_type: "image",
    format: "pdf",
    type: "upload",
    access_mode: "public", // Explicit
    sign_url: true,
    secure: true
});
console.log('1. With access_mode:', url1);

// 2. Without type (default)
const url2 = cloudinary.url(publicId, {
    resource_type: "image",
    format: "pdf",
    // type: "upload", // omitted
    sign_url: true,
    secure: true
});
console.log('2. Without type:', url2);

// 3. With version (if 1771110878 exists)
const url3 = cloudinary.url(publicId, {
    resource_type: "image",
    format: "pdf",
    type: "upload",
    version: "1771110878",
    sign_url: true,
    secure: true
});
console.log('3. With version:', url3);

