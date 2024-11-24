const os = require("os");
const fs = require("fs");
const path = require("path");
const stream = require("stream");
const http = require("node:http");

const handler = (req, res) => {
  const endOutput = (newTemperature) => {
    res.end(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Temperature Converter</title>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: "Arial", sans-serif;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(to right, #6a11cb, #2575fc);
        color: #333;
        overflow-x: hidden;
      }

      .container {
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        padding: 20px;
        width: min(90%, 400px);
        margin: 20px;
      }

      h1 {
        font-size: 1.8rem;
        color: #444;
        margin-bottom: 20px;
      }

      form {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        width: 100%;
      }

      .input-container {
        width: 100%;
      }

      input[type="number"] {
        width: 100%;
        padding: 10px;
        border: 2px solid #ddd;
        border-radius: 5px;
        font-size: 1rem;
        transition: border-color 0.3s ease;
      }

      input[type="number"]:focus {
        border-color: #2575fc;
        outline: none;
      }

      .radio-group {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        width: 100%;
      }

      label {
        font-size: 1rem;
        color: #555;
        display: flex;
        align-items: center;
        gap: 5px;
      }

      button {
        padding: 10px 20px;
        background: #2575fc;
        color: #fff;
        border: none;
        border-radius: 5px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.3s ease;
        width: 100%;
        max-width: 200px;
      }

      button:hover {
        background-color: #1a5bb8;
      }

      .result {
        font-size: 1.2rem;
        color: #d32f2f;
        margin-top: 20px;
        padding: 10px;
        border: 2px solid #d32f2f;
        border-radius: 5px;
        background: rgba(211, 47, 47, 0.1);
        word-wrap: break-word;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Temperature Converter</h1>
      <form method="post">
        <div class="input-container">
          <input
            type="number"
            name="temperature"
            placeholder="Enter temperature"
            required
          />
        </div>
        <div class="radio-group">
          <label>
            <input type="radio" value="cToF" name="radio" required />
            Celsius to Fahrenheit
          </label>
          <label>
            <input type="radio" value="fToC" name="radio" required />
            Fahrenheit to Celsius
          </label>
        </div>
        <button type="submit">Convert</button>
      </form>
      <div class="result">Converted temperature is: ${newTemperature}</div>
    </div>
  </body>
</html>

                `);
  };
  if (req.method === "GET") {
    res.setHeader("Content-Type", "text/html"); // 2nd para - type of content (mime types)
    endOutput("Nothing happened");
  } else {
    let totalData = "";
    req.on("data", (chunk) => (totalData += chunk.toString()));
    req.on("end", () => {
      // "end" - end of Stream
      let temperature = totalData.split("&")[0].slice(12);
      let newTemperature = "";
      if (totalData.endsWith("cToF")) {
        newTemperature = Math.round(parseInt(temperature) * (9 / 5) + 32);
        endOutput(newTemperature);
      } else if (totalData.endsWith("fToC")) {
        newTemperature = Math.round((parseInt(temperature) - 32) * (5 / 9));
        endOutput(newTemperature);
      }
      // get the num and do the math -> give back to browser
    });
  }

  // send back to users' browser
}; // req(request) - readStream, res(response) - writeStream

const webServer = http
  .createServer(handler)
  .listen(8081, () => console.log("Web is running"));
// .listen(num) - to identify web server <-- http://localhost:8081/<path>
// create web server - .createServer(callback) ->  how many request -> many of callbacks
// callback use para as stream

// node app.js --watch - act like live server
