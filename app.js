require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// hashing and salting and authentication using passport
const session=require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');




// const bcrypt=require("bcrypt");
// const saltRounds=10;

// const md5=require("md5");
// const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

// Initialized the session
app.use(session({
  secret: "Our little secret.", //This is the secret used to sign the session ID cookie
  resave: false, //Yeh kiss liye hai ??????? Smjh nahi aaya
  saveUnintialized: false //Yeh kiss liye hai ??????? Smjh nahi aaya
}));

// Setting the passport
app.use(passport.initialize());

// Telling passport to setup the session also
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});
// mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

// Adding plugin to userSchema to hash and salt the password and save into mongodb
userSchema.plugin(passportLocalMongoose);

// const secret = process.env.SECRET;
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

/*
// we're ready to configure the very last thing which is the passport local configurations and we're going
// to use exactly the same as what the documentation tells us to do which is to create a strategy which
// is going to be the local strategy to authenticate users using their username and password and also to
// serialize
// and deserialise our user. Now the serialise and deserialise is only necessary when we're using sessions.
// And what it does is when we tell it to serialize our user it basically creates that fortune cookie and
// stuffs the message namely our users identifications into the cookie. And then when we deserialise it basically allows
// passport to be able to crumble the cookie and discover the message inside which is who this user is.
// And all of their identification so that we can authenticate them on our server.
*/

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets",function(req,res){
  // Check if the user is authenticated (already logged in - simply render the secrets page)
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
});


app.get("/logout",function(req,res){
 // Deauthenticate the user and destroy the session
 req.logout(function(err){
    if(err){
      console.log(err);
    }else{
      console.log("user successfully logged out");
    }
  });
 res.redirect("/");
})

app.post("/register", function(req, res){
  // Using passport-local-mongoose package to use to register the user
  // Handles creating,saving a new user and interacting with mongoose directly
  // Salting and Hashing apne aap ho jaayega
  /*
      {
          _id:
          v:
          username:
          salt:
          hash:
      }
      aisi values create ho jaayengi
  */
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      //Authenticate user (here authentication is of local type,cookie create krrega ek jo bolega ki jbb tkk browser close nahi hota yeh user directly localhost:3000/secrets ko access krr skta hai bcz woh session chal rha hai)
      passport.authenticate("local")(req,res,function(){
      // if authenticate was successful to setup the cookie that contains there current logged in session
      res.redirect("/secrets");
      })
    }
  })
});

app.post("/login",function(req,res){

  const user=new User({
    username:req.body.username,
    password:req.body.password
  });

  // use passport to login and authenticate
  req.login(user,function(err){
      if(err){
        // Unable to find the user in database
        console.log(err);
      }else{
          // authenticate the user which will create cookie
          passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
            // sending the cookie to browser telling that they are authorize to view the page
          });
      }
  });
});

app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
