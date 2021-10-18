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

//models
const User = require("./models/user")
const Product = require("./models/product")
const Order = require("./models/order")


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
      cb(null, file.originalname);
    }
  });

const upload = multer({ storage: storage });

//ejs
app.set("view-engine" , "ejs")

//signup get
app.get("/" , (req , res) =>{
    let message= null;
    res.render("signup.ejs" ,{ message: message })
})

//signup post
app.post("/signup" , async (req,res) => {
        try{
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const user = new User({
                name : req.body.name,
                email : req.body.email,
                password : hashedPassword,
            })
            await user.save();
            res.redirect("/login")
        } catch{
            res.redirect("/")
        }  
})

//loginget
app.get("/login" , (req,res) => {
    let message = null
    res.render("login.ejs" ,{ message: message })
})

//login post
app.post("/signin" , async (req, res) =>{
    await User.find({email: req.body.email}).then(data => {
        console.log(data)
        if(data == undefined){
            const message = "invalid username or password"
            res.render("login.ejs" , { message: message })   
        }
        const verified = bcrypt.compareSync(req.body.password, data[0].password);
        console.log(data[0].role)
        if(verified){
            if(data[0].role == "admin"){
                req.session.user = data[0]
                res.redirect("/adminpanel") 
            }
            else{
                req.session.user = data[0]
                res.redirect("/home")
            }
        }
        else{
            const message = "invalid username or password"
            res.render("login.ejs" , { message: message }) 
        }
    }).catch(e =>{
        console.log(e)
        res.send("Error")
    })
})


//home get
app.get("/home" , async (req , res) =>{
    const latest = await Product.find().sort({ _id: -1 }).limit(8)
    const feature = await Product.find().limit(8)
    res.render("index2.ejs" , {
        latests : latest ,
        features : feature
    })
})

//product page
app.get("/products", async (req , res) => { 
    await Product.find().then(product =>{
        res.render("products.ejs" , {
            products: product,
        })  
    })
})

//product page
app.get("/productdetail/:id", async (req , res) => { 
    try{
    const product = await Product.findById(req.params.id) 
    const related = await (await Product.find({type : product.type , _id: { $ne: req.params.id }}).limit(4))
    console.log(related)
        res.render("productDetails.ejs" , {
            products: product,
            related_products: related,
        })  
    } catch (error){
        console.log(error)
        res.send("error")
    } 
})

//add to cart
app.post("/additem/:id" , upload.single('image'), async (req , res) => {
    await Product.findById(req.params.id).then(data => {
        try{
            const item = new Order({ 
                userid: req.session.user._id, 
                name: data.name,
                price: data.price,
                image: data.image,
                qty: req.body.root,
            })
            item.save();
            res.redirect("/products")
    } catch (error){
        console.log(error)
        res.send("error")
    } 
  })
})

//cart page
app.get("/cart", async (req , res) => {  
    await Order.find({userid: req.session.user._id }).then(order =>{
        let totalvalue=0
        for(i in order){
           let value = order[i].qty * order[i].price
           totalvalue +=value
        }
        console.log(totalvalue)
        res.render("cart.ejs" , {
            // orders: order,
            // name: req.session.user.name,
            // total: totalvalue
        })  
    }).catch(error => {
        console.log(error)
        res.send("error")
    })
})

//delete
app.post("/delete/:id", async (req , res) =>{
    await Order.findByIdAndDelete({_id: req.params.id}).then(result =>{
        if(result){
            res.redirect("/cart")
        }else{
            res.send("error")
        }
    }).catch(e => {
        res.send("error in catch")
    })
})

// ------------------------ admin side ------------------------------ 

//admin page
app.get("/admin", (req , res) => {  
    res.render("index2.ejs")  
})

//admin add product
app.get("/addproduct", (req , res) => {  
    res.render("add.ejs")  
})

//admin post
app.post('/add', upload.single('image'), async (req, res, next) => {
    try{  
        const data = new Product ({
        name: req.body.name,
        price: req.body.price,
        type: req.body.type,
        image: req.file.filename,
        seller: req.session.user.name,
        description: req.body.desc
      }) 
        console.log(data)
        data.save()
        res.redirect('/index2') //admin-menu-page
    }catch(error){
        console.log(error)
    }    
})

//edit food Get
app.get("/edititem" , async (req, res) =>{
    await Product.findById(req.params.id).then( data => {
         console.log(data)
         res.render("update.ejs" , {
         product: data
            })  
        }).catch( e =>{
        console.log(e)
        res.send("error")
    })
})

//edit food post
app.post("/update/:id" , async(req , res) =>{
    await Food.findOneAndUpdate({_id: req.params.id}, {
        $set: {
            name: req.body.name,
            price: req.body.price,
        }
    }).then(result => {
        if(result){
            console.log(result)
            res.redirect("/index2")   //admin-menu-page
        }else{
            res.send("error")
        }
    }).catch(e => {
        res.send(e)
    })
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