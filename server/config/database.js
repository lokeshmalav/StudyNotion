//initiating mongoose
const mongoose = require("mongoose");
//importing from .env file
require("dotenv").config();

const MONGODB_URL = process.env.MONGODB_URL;

//connecting with database
exports.connect = () => {
    mongoose.connect(MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology:true,
    })
    .then(() => console.log("DB Connected Successfully"))
    .catch( (error) => {
        console.log("DB Connection Failed");
        console.error(error);
        process.exit(1);
    } )
};