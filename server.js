const express = require('express')
const app = express()
const path = require('path')
const logger = require("morgan")
const mongoose = require("mongoose")
const session = require("express-session")
const bcrypt = require("bcrypt");
const multer = require('multer');

//middleware
app.use(express.static(path.join(__dirname, "public")))
app.use(logger("dev"))
app.use(express.json());
app.use(express.urlencoded({ extended: false}))

//session
// app.use(session({
//     secret: process.env.SECRET ,
//     resave: true ,
//     saveUninitialized:true,
// }))

//ejs
app.set("view-engine" , "ejs")

//signup get
app.get("/" , (req , res) =>{
    res.send("hello")
})


//listening on port

let port = 3000;
app.listen(port, () => {
    console.log("Listening on port")
})