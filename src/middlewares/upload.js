const multerS3 = require('multer-s3');
const multer = require('multer'); 
const path = require('path'); 

const s3 = require('./S3'); 
const _ = require('lodash')

const upload = multer({
    storage: multerS3({
        s3,
        acl: 'public-read',
        bucket: process.env.BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {   
            const fileName = `${Date.now()}-photo-${file.originalname}`;
         
        

        
                
              cb(null, `images/${fileName}`);
            
            
        }
    })
});

module.exports = upload;