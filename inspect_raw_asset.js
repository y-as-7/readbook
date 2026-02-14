const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const publicId = 'ocvzcyf8eg3bw5bouycm'; // From user error

cloudinary.api.resource(publicId, {
  resource_type: 'raw',
  type: 'upload'
})
.then(result => {
  console.log('Raw Resource Info:', JSON.stringify(result, null, 2));
})
.catch(error => {
  console.error('Raw Resource Error:', error);
  // Try finding with .pdf extension
  cloudinary.api.resource(publicId + '.pdf', {
    resource_type: 'raw',
    type: 'upload'
  })
  .then(res => console.log('Raw Resource (.pdf) Info:', JSON.stringify(res, null, 2)))
  .catch(err => console.error('Raw Resource (.pdf) Error:', err));
});
