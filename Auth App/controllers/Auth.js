const bcrypt = require('bcrypt') ; 
const User = require('../models/User') ;  
const jwt = require('jsonwebtoken') ;
require('dotenv').config() ; 

// signup router handler 
exports.signup = async (req,res) => {
  try{
    // get data
    const {name , email , password , role} = req.body ; 
    // check if user already exists 
    const existingUser = await User.findOne({email:email}) ; 
    if(existingUser){
      return res.status(400).json({
        success : false , 
        message : "User already exists"
      })
    }

    // secure password
    let hashedPassword ; 
    try{
      hashedPassword = await bcrypt.hash(password,10) ; 
    }
    catch(err){
      res.status(500).json({
        success : false , 
        message : 'Issues with hashing password'
      })
    }

    // create entry for user 
    const user = await User.create({
      name : name , 
      email : email , 
      password : hashedPassword , 
      role : role 
    }) ;

    return res.status(200).json({
      success : true , 
      message : 'User created Successfully'
    })

  } 
  catch(error){
    console.log("Issues with signup route") ; 
    console.error(error) ; 
    return res.status(500).json({
      success : false , 
      message : "User cant be register , Please try again later ."
    })
  }
}

// login 
const JWT_SECRET = process.env.JWT_Secret ; 

exports.login = async (req , res) => {
  try{
    // data fetch
    const {email , password} = req.body ; 
    // validation of email and password 
    if(!email || !password){
      return res.status(400).json({
        success : false , 
        message : 'Please fill all the details.'
      })
    }

    // check for registered user
    let user = await User.findOne({email : email}) ; 
    // if not a registered user 
    if(!user){                                          
      return res.status(401).json({
        success : false , 
        message : "User is not registered"  
      }) ; 
    }

    const payload = {
      email : user.email , 
      id : user._id  ,
      role : user.role
    }
    // verify password  and  generate a JWT token
    if(await bcrypt.compare(password,user.password)){
      // password matched 
      let token = jwt.sign(payload , JWT_SECRET , {expiresIn : '2h'}) ;

      // Converting it to object first
      user = user.toObject() ; 
      user.password = undefined ; 
      user.token = token ;

      const options = {
        expires : new Date(Date.now()+3*24*60*60*1000) ,
        httpOnly : true , // cannot be accessed at client side
      }

      res.cookie('token',token,options).status(200).json({
        success : true , 
        token , 
        user , 
        message : "User Logged in Successfully . " 
      }) ;
    }
    else{
      // password do not match 
      return res.status(403).json({
        success : false ,
        message : "Password Incorrect"
      })
    }
  }
  catch(error){
    console.log("Issues with login route") ; 
    console.error(error) ; 
    return res.status(500).json({
      success : false , 
      message : "Login failed, Please try again later."
    })
  }
}
