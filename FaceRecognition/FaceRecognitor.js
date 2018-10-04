const fr = require('face-recognition');
const fs = require('fs');
const { join } = require('path')

// Processes images from ./data/raw/
// The data should be named as [player]_[uniqueid].png
// Finds player faces from the images and saves the processed images to ./data/processed/[player]/[uniqueid].png
const processImages = (callback) => {
    const dataFolder = './data/raw';
    fs.readdir(dataFolder, (err, files) => {
        if (err) {
            console.log('Error in reading the raw data folder: ', err);
            callback(false);
        }
        files.forEach(file => {
            console.log(`Processing: ${file}`);
            const filesplit = file.split('.');
            if (filesplit[filesplit.length-1] === 'png') {
                const player = filesplit[0].split('_')[0];
                const id = filesplit[0].split('_')[1];

                const image = fr.loadImage(dataFolder + '/' + file);
                const detector = fr.FaceDetector()
                const targetSize = 150
                const faceImages = detector.detectFaces(image, targetSize)
                const savePath = `./data/processed/${player}/${id}.png`;
                console.log(`FaceImages: ${faceImages}, saving to ${savePath}`);

                if (!fs.existsSync(`./data/processed/${player}`)) {
                    fs.mkdirSync(`./data/processed/${player}`);
                }
                faceImages.forEach((img, i) => fr.saveImage(savePath, img))
            }
        });
        callback(true);
    })
}

// Loads the data from ./data/processed/[player]/*.png and trains the model.
// Saves the model to ./data/model.json for later use
const trainModel = (callback) => {
    console.log("Training the model");
    const dataPath = './data/processed';

    const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(join(p, f)).isDirectory())

    const faces = {};
    players = dirs(dataPath);
    players.forEach(player => {
        const files = fs.readdirSync(`${dataPath}/${player}`);        
        faces[player] = files.map(file => fr.loadImage(`${dataPath}/${player}/${file}`));
    });

    // Create & Train the model
    const recognizer = fr.FaceRecognizer()

    Object.keys(faces).forEach(function(player,index) {
        const numJitter = 10;

        console.log(`For player ${player}, got ${faces[player].length} faces`);
        recognizer.addFaces(faces[player], player, numJitter);
    });

    fs.writeFile('./data/model.json', JSON.stringify(recognizer.serialize()), err => {
        if (err) {
            console.log('Failed to save model to local file system: ', err);
            callback(false);
        }
        console.log('Model trainer and saved to ./data/model.json');
        callback(true);
    });
    
}

// Predicts the player
// Loads a presaved model from ./data/model.json
const whoIsIt = () => {
    const model = JSON.parse(fs.readFileSync('./data/model.json'));
    const recognizer = fr.FaceRecognizer()
    recognizer.load(model);
    
    const imageRGB = fr.loadImage('./data/tmp/tmp.png');

    const detector = fr.FaceDetector()
    const targetSize = 150

    // Assume only one face in the picture
    const face = detector.detectFaces(imageRGB, targetSize)[0];

    //const recognizer = trainModel();
    console.log(recognizer.predict(face));
    return recognizer.predictBest(face);
};

module.exports = {
    processImages,
    trainModel,
    whoIsIt
} 
