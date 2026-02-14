const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// List recent resources
cloudinary.api.resources({
  type: 'upload',
  resource_type: 'image',
  max_results: 5,
  direction: 'desc'
})
.then(result => {
  console.log('Recent Resources:');
  result.resources.forEach(res => {
    console.log(JSON.stringify({
      public_id: res.public_id,
      created_at: res.created_at,
      access_mode: res.access_mode,
      url: res.url
    }, null, 2));
  });
})
.catch(error => {
  console.error('List Error:', error);
});
