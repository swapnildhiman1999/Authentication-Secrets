require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const bcrypt=require("bcrypt");
const saltRounds=10;

// const md5=require("md5");
// const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

// const secret = process.env.SECRET;
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", function(req, res){
    bcrypt.hash(req.body.password,saltRounds,function(err,hash){
      const newUser=new User({
        email:req.body.username,
        password:hash
        // password:md5(req.body.password)
      });
      newUser.save(function(err){
        if (err) {
          console.log(err);
          res.redirect("register");
        } else {
            res.render("secrets");
        }
      });
    });
});

app.post("/login",function(req,res){
    const username=req.body.username;
    const password=req.body.password;
    // const password=md5(req.body.password);
    // comparing the hashed form of the password
    // console.log(username);
    // console.log(password);
    // checking in the collection of users
    User.findOne({email:username},function(err,foundUser){
      if(err){
        console.log(err);
      }else{
        if(foundUser){
          bcrypt.compare(password,foundUser.password,function(err,result){
              if(result===true){
                res.render("secrets");
              }else{
                res.send("Wrong Password");
              }
          });
      }else{
          res.send("Need to register first dude....!");
      }
    }
  });
});

app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
