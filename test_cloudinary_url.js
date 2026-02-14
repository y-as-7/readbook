const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const publicId = 'qamsxkidagdtcnvqhklb'; 
const version = '1771107538'; // Removed 'v'

const urlUpload = cloudinary.url(publicId, {
  resource_type: 'image',
  type: 'upload',
  sign_url: true,
  version: version,
  secure: true
});
console.log('Signed Upload URL:', urlUpload);

const urlAuth = cloudinary.url(publicId, {
  resource_type: 'image',
  type: 'authenticated',
  sign_url: true,
  version: version,
  secure: true
});
console.log('Signed Auth URL:', urlAuth);

const urlPrivate = cloudinary.url(publicId, {
  resource_type: 'image',
  type: 'private',
  sign_url: true,
  version: version,
  secure: true
});
console.log('Signed Private URL:', urlPrivate);
