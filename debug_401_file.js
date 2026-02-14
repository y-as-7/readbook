const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const publicId = 'bmxjcd91uiyicazht9ih.pdf'; 
const version = '1771111614';
const errorUrl = 'https://res.cloudinary.com/damzt8koa/raw/upload/s--s1SddOlV--/v1771111614/bmxjcd91uiyicazht9ih.pdf?_a=BAMAAARj0';

console.log('--- Inspecting Asset ---');
cloudinary.api.resource(publicId, { resource_type: 'raw', type: 'upload' })
.then(res => {
    console.log('Asset Info:', JSON.stringify(res, null, 2));
    
    console.log('--- Verifying Signature ---');
    const generatedUrl = cloudinary.url(publicId, {
        resource_type: "raw",
        type: "upload",
        sign_url: true,
        secure: true,
        version: version
    });
    console.log('Generated URL:', generatedUrl);
    console.log('Error URL:    ', errorUrl);
    
    if (generatedUrl.split('?')[0] === errorUrl.split('?')[0]) {
        console.log('MATCH: Signature matches generated URL.');
    } else {
        console.log('MISMATCH: Signatures differ.');
    }
})
.catch(err => console.error('Asset Check Error:', err));
