//Used to connect to the Elasticsearch node
const { Client } = require("@elastic/elasticsearch");
const fs = require("fs");
const client = new Client({
  node: "https://localhost:9200",
  auth: {
    username: "elastic",
    password: "OV3mv=U2R2x6QkAskwEq",
  },
  tls: {
    ca: fs.readFileSync(
      "/home/nikos/MyFiles/University/8th Semester/Ανάπτυξη Εφαρμογών ΠΛ/Φ4/bookie_elasticsearch/elasticsearch-8.7.1/config/certs/http_ca.crt"
    ),
    rejectUnauthorized: false,
  },
});

module.exports = { client };
