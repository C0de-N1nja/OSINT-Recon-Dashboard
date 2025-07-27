const mongoose = require("mongoose")

const url = "mongodb://localhost:27017/OSINT_DB"

function connectDB(){   
    mongoose.connect(url)
    .then(function() {
        console.log("Connected to Database!")
        
    })
    .catch(function(err) {
        console.log(err)
        
    });
}
    

module.exports = connectDB