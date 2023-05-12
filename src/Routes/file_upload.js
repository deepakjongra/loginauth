const express = require("express");
const fileUpload = require("express-fileupload");
const pool = require("../Config/DataBaseConfig");
const router = express.Router();
require("dotenv").config();

const AWS = require("aws-sdk");
router.use(fileUpload());

router.post("/upload", async (req, res) => {
  AWS.config.update({
    accessKeyId: process.env.ACCESSKEYID,
    secretAccessKey: process.env.SECRETACCESSKEY,
    region: "ap-south-1",
  });

  const s3 = new AWS.S3();

  const fileContent = Buffer.from(req.file.data, "binary");

  const params = {
    Bucket: "bharatgo-app-t1",
    Key: req.file.name,
    Body: fileContent,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      throw err;
    }
    res.status(201).send(data.Location);
  });
});

module.exports = router;
