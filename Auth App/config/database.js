const mongoose = require("mongoose") ; 

require("dotenv").config() ; 
const url = process.env.DATABASE_URL ; 

const dbConnect = () => {
  mongoose.connect(url)
  .then(()=>{
    console.log("DB Connected Successfully") ; 
  })
  .catch((error) => {
    console.log("Issues in connection of Database") ; 
    console.error(error) ; 
    process.exit(1) ; 
  })
}

module.exports = dbConnect ; 