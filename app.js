const express = require('express');
const requests = require('https');
const app = express();
const rateLimit = require("express-rate-limit");
const { MONGO_CRED, PORT } = process.env

// Heroku doesn't lie
app.enable("trust proxy");
// no DoS/DDoS shutdown
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}))
// HTTPS only
app.use((req, res, next) => {
  if (req.secure) {
    return next()
  }
  return res.redirect("https://" + req.hostname + req.url);
})

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/signup.html");
});

app.post("/", function(req, res) {
  const fname = req.body.fname;
  const lname = req.body.lname;
  const email = req.body.email;
  const data = {
    members: [
      {
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: fname,
          LNAME: lname
        }
      }
    ]
  };
  const jsonData = JSON.stringify(data);
  const url = "https://us17.api.mailchimp.com/3.0/lists/8bd2d58897";
  const options = {
    method: "POST",
    auth: MONGO_CRED
  };
  const request = requests.request(url, options, function(response) {
    if (response.statusCode === 200) {
      res.sendFile(__dirname + "/success.html");
    } else {
      res.sendFile(__dirname + "/failure.html");
    }
    response.on("data", function(data) {
      console.log(JSON.parse(data));
    });
  });
  request.write(jsonData);
  request.end();
});

app.get("/failure", function(req, res) {
  res.redirect("/");
});

app.listen(PORT || 3000, function() {
  console.log(`Node sever listening on port ${PORT || 3000}!`);
});
