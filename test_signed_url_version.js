const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const publicId = 'ocvzcyf8eg3bw5bouycm.pdf'; // raw public_id usually includes extension
const version = '1771111253';

console.log('--- Testing Signed URL with Version ---');

// 1. With version
const url1 = cloudinary.url(publicId, {
    resource_type: "raw",
    type: "upload",
    sign_url: true,
    secure: true,
    version: version
});
console.log('1. With version:', url1);

// 2. Without version
const url2 = cloudinary.url(publicId, {
    resource_type: "raw",
    type: "upload",
    sign_url: true,
    secure: true
    // version omitted
});
console.log('2. Without version:', url2);

