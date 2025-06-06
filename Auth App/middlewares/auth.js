
// auth , isStudent , isAdmin

const jwt = require('jsonwebtoken') ; 
require('dotenv').config() ; 

exports.auth = (req,res,next)=>{
  try{
    // extract JWT Token
    // PENDING : Others ways to fetch token
    const token = req.body.token ;

    if(!token){
      return res.status(401).json({
        success : false , 
        message : 'Token missing' 
      }) ; 
    }

    // verify the token 
    const jwt_secret = process.env.JWT_Secret ; 
    try{

      const payload = jwt.verify(token , jwt_secret ) ; 
      console.log(payload) ; 
      // Why this -> Very important step 
      req.user = payload ; 

    }
    catch(error){
      return res.status(401).json({
        success : false , 
        message : "Token is invalid "
      })
    }
    next() ; 
  }
  catch(error){
    return res.status(401).json({
      success : false , 
      message : 'Something went wrong , while verifying the token'
    })
  }
}

exports.isStudent = (req,res,next) => {
  try{
    if(req.user.role !== 'Student'){
      return res.status(401).json({
        success : false , 
        message : 'This is a protected route for student' 
      })
    }
    next() ; 
  }
  catch(error){
    return res.status(500).json({
      success : false , 
      message : 'User role can not be verified , internal server error'
    })
  }
}

exports.isAdmin = (req , res , next) => {
  try{
    if(req.user.role !== 'Admin'){
      return res.status(401).json({
        success : false , 
        message : 'This is protected route for Admin' ,
      })
    }
    next() ; 
  }
  catch(error){
    return res.status(500).json({
      success : false , 
      message : "User role can not be verifed , internal server error"
    })
  }
}