const express = require("express");
const fileUpload = require("express-fileupload");
const pool = require("../Config/DataBaseConfig");
const router = express.Router();
require("dotenv").config();

const AWS = require("aws-sdk");
router.use(fileUpload());

router.post("/upload/:user_id", async (req, res) => {
  AWS.config.update({
    accessKeyId: process.env.ACCESSKEYID,
    secretAccessKey: process.env.SECRETACCESSKEY,
    region: "ap-south-1",
  });

  const s3 = new AWS.S3();
  const user_id = req.params.user_id
  const fileContent = Buffer.from(req.files.data.data, "binary");

  const params = {
    Bucket: "bharatgo-app-t1",
    Key: req.files.data.name,
    Body: fileContent,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      res.sendStatus(403)
      throw err
    }
    const url = data.Location
    pool.query("update users set profile_image= $1 where user_id = $2",[url,user_id])
    res.status(201).send(url);
  });
});

module.exports = router;
