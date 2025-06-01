const express = require('express') ; 
const app = express() ;

require('dotenv').config() ; 
const port = process.env.PORT ; 

app.use(express.json()) ; 

const dbConnect = require('./config/database.js') ; 
dbConnect() ; 

// route import and mount 
const user = require('./routes/user.js') ; 
app.use('/api/v1',user) ; 

// server activation
app.listen(port , ()=>{
  console.log(`Server started at port ${port}`) ; 
}) ; 