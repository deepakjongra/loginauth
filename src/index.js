const express = require("express");
var cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
require("dotenv").config();

const app = express();
const swaggerDocument = YAML.load("./swagger.yml");
app.use(cors());
app.use("/api-docks", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());

app.use(require("./Routes/User"));


app.listen(8080, () => {
    console.log(`running on http://localhost:8080`);
  });