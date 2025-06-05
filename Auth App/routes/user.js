const express = require('express') ; 
const router = express.Router() ; 

// Import Controller
const {login , signup} = require('../controllers/Auth.js') ;  
const {auth , isStudent , isAdmin} = require('../middlewares/auth.js') ; 

// Mount 
// router.post('/login',login) ; 
router.post('/signup',signup) ; 
router.post('/login',login) ; 

// testing protected route
router.get('/test', auth , (req , res) => {
  return res.json({
    success : true , 
    message : "Welcome to protected route for TESTS "
  }) ; 
})
// Protected Route
router.get('/student', auth , isStudent , (req ,res)=>{
  return res.json({
    success : true , 
    message : "Welcome to the protected route for Students . "
  })
}) ; 
router.get('/admin', auth , isAdmin , (req ,res) => {
  return res.json({
    success : true , 
    message : "Welcome to the protected route for Admin . " 
  })
}) ;  

// Export 
module.exports = router ; 