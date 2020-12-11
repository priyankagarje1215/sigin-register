const express = require("express");
const router = express.Router();
require("dotenv").config();

//import controller
const {signup,accountActivation,signin,forgetPassword,resetPassword} = require("../controllers/auth");

router.post('/signup',function(req,res){signup});
router.post('/account-activation',function(req,res){accountActivation});
router.post('/signin',function(req,res){signin});

// forget/reset password routes
router.put('/forget-password',function(req,res){forgetPassword});
router.put('/reset-password',function(req,res){resetPassword});

module.exports = router;
