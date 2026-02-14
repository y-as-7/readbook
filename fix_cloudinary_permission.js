const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const publicId = 'qamsxkidagdtcnvqhklb'; 

// Try to update access mode to public
cloudinary.api.update(publicId, {
  resource_type: 'image',
  type: 'upload',
  access_mode: 'public'
})
.then(result => {
  console.log('Update result:', result);
})
.catch(error => {
  console.error('Update error:', error);
});
