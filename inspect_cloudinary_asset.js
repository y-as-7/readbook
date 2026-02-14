const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const publicId = 'qamsxkidagdtcnvqhklb'; 

cloudinary.api.resource(publicId, {
  resource_type: 'image',
  type: 'upload'
})
.then(result => {
  console.log('Resource Info:', JSON.stringify(result, null, 2));
})
.catch(error => {
  console.error('Resource Error:', error);
  // Try authenticated type if upload fails
  cloudinary.api.resource(publicId, {
    resource_type: 'image',
    type: 'authenticated'
  }).then(res => console.log('Auth Resource Info:', JSON.stringify(res, null, 2)))
    .catch(err => console.error('Auth Resource Error:', err));
});
