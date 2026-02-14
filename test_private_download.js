const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const publicId = 'bmxjcd91uiyicazht9ih.pdf'; 
const version = '1771111614';

console.log('--- standard signed url ---');
const stdUrl = cloudinary.url(publicId, {
    resource_type: "raw",
    type: "upload",
    sign_url: true,
    secure: true,
    version: version
});
console.log(stdUrl);

console.log('--- private_download_url ---');
try {
    const privUrl = cloudinary.utils.private_download_url(publicId, '', {
        resource_type: "raw",
        type: "upload",
        version: version,
        secure: true
    });
    console.log(privUrl);
} catch (e) {
    console.log('Error:', e.message);
}
