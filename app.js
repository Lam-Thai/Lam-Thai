const os = require("os");
const fs = require("fs");
const path = require("path");
const stream = require("stream");
const http = require("node:http");

const ctoF = (num) => {
  Math.round((num * 9) / 5 + 32);
};

const ftoC = (num) => {
  Math.round((num - 32) * (5 / 9));
};

const handler = (req, res) => {
  if (req.method === "GET") {
    res.setHeader("Content-Type", "text/html"); // 2nd para - type of content (mime types)
    res.end(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Converter</title>
            </head>
            <body>
              <h1>Temperature Converter</h1>
              <form method="post">
                <input type="number" name="temperature" placeholder="Temperature" />
                <input type="radio" name="celToFal" /> C to F 
                <input type="radio" name="falToCel" /> F to C
                <input type="submit" value="Convert" /> 
              </form>
            </body>
          </html>
          `);
  } else {
    let totalData = "";
    req.on("data", (chunk) => (totalData += chunk.toString()));
    req.on("end", () => {
      // "end" - end of Stream
      if (totalData.toString() === "falToCel") {
        res.end(ftoC(parseInt(totalData.split("=")[1])));
      } else {
        res.end(ctoF(parseInt(totalData.split("=")[1])));
      } // get the num and do the math -> give back to browser
    });
  }

  // send back to users' browser
}; // req - readStream, res - writeStream

const webServer = http
  .createServer(handler)
  .listen(8081, () => console.log("Web is running"));
// .listen(num) - to identify web server <-- http://localhost:8081/<path>
// create web server - .createServer(callback) ->  how many request -> many of callbacks
// callback use para as stream

// node app.js --watch - act like live server
