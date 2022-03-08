var fs = require('fs');
const bodyParser = require("body-parser")
const express = require("express")
const cors = require('cors')
const https = require('https');

const privateKey  = fs.readFileSync('/etc/letsencrypt/live/api.sorare.webdevvision.fr/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/api.sorare.webdevvision.fr/fullchain.pem', 'utf8');
const credentials = {key: privateKey, cert: certificate};

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.post("/contact", function (req, res) {
  mailer.sendMail(
    {
      from: [contactAddress],
      to: req.body.sender,
      subject: "WebDevVision",
      html: `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head><body><main><a href="webdevvision.fr"><img alt="Header Image" width="100" src="cid:logo" /></a><h2 style="margin: 0;padding-top:16px;color: #1E3D59;">Votre demande sur <span>Web</span><span>Dev</s
})

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(5999);
