require("dotenv").config()
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
app.use(session({
    secret: process.env.SECRET ,
    resave: true ,
    saveUninitialized:true,
}))

//dbconnect
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("DB connected"))
  .catch(error => console.log(error))

//image storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, './public/uploads');
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + file.originalname);
    }
  });

const upload = multer({ storage: storage });

//ejs
app.set("view-engine" , "ejs")

//signup get
app.get("/" , (req , res) =>{
    res.render("index.ejs")
})

//logout
app.get("/logout", (req , res) => {
    req.session.destroy()
    res.redirect("/")
})

//middleware
function checkauthentication(req, res, next) {
    if(req.session.user){
        return next()
    }else {
        res.redirect("/")
    }
}

//logout
app.post("/logout", (req, res) => {
    req.session.destroy()
    res.redirect("/")
})

//listening on port

let port = 3000;
app.listen(port, () => {
    console.log("Listening on port")
})