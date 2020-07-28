const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const flightsRoutes = require('./routes/flight');
const authRoutes = require('./routes/auth');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const mongoDbUrl = `mongodb+srv://${process.env.MONGO_USER_NAME}:${process.env.MONGO_PASSWORD}@lionflight-efwcz.gcp.mongodb.net/<dbname>?retryWrites=true&w=majority`
const mongoose = require('mongoose');
const { static } = require('express');

app.use(bodyParser.json());
app.use(helmet());
app.use(compression());

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
app.use(morgan('combined', { stream: accessLogStream }));

const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    next();
})
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data || undefined;
    return res.status(status).json({ message, data })
})
app.use(flightsRoutes);
app.use(authRoutes);
//handle production
if(process.env.NODE_ENV === 'production'){
    //static folder
    app.use(express.static(__dirname + '/public/'));

    //handle SPA 
    app.get(/.*/,(req,res) => {
        res.sendFile(__dirname+ '/public/index.html')
    })
}

mongoose.connect(mongoDbUrl)
.then(() => {
    //the hosting provider will inject the port
    const server = app.listen(process.env.PORT || 3000);
    //const server = https.createServer({key: privatKey,cert: certificate},app).listen(process.env.PORT || 3000);
})
.catch(err=>{
    console.log(err)
})

