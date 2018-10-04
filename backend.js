const express = require('express');
const request = require('request');
const cors = require('cors');
const fs = require('fs');
const bodyParser = require("body-parser");

const FaceRecognitor = require('./FaceRecognition/FaceRecognitor')

const app = express();

app.use(cors());
app.use(bodyParser.json({limit: '10mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))

// POST training data
app.post('/image', function(req, res) {
    console.log('POST with image')
    let image = req.body.image.split(',')[1];
    let name = 'data/raw/' + req.body.name + '_' + 
        Math.floor(new Date() / 1000) + '.png';
    let bitmap = new Buffer(image, 'base64');
    fs.writeFileSync(name, bitmap);
    console.log('Saved image to: ' + name)
    res.sendStatus(200);
});

// Process images
app.get('/process', function(req, res) {
    FaceRecognitor.processImages(success => {
        res.json({preprocessSuccess: success})
    });
});

// Train the model
app.get('/train', function(req, res) {
    FaceRecognitor.trainModel(success => {
        console.log('Model trained: ', success);
        res.json({'model_trained': success});
    });
});

// POST base64 image and save it to temporary file 
// ./data/tmp/tmp.png
// Use FaceRecognitor to ask whose fase the image is of
app.post('/whoisit', function(req, res) {
    console.log('WHO IS IT??')
    let image = req.body.image.split(',')[1];
    let name = './data/tmp/tmp.png';
    let bitmap = new Buffer(image, 'base64');
    fs.writeFileSync(name, bitmap);
    const player = FaceRecognitor.whoIsIt();
    console.log('IT IS: ', player.className);
    res.json({"playerName": player});    
});

app.use(express.static('public'));

app.listen(3000, () => console.log('Facial recognition backend initialized'));
