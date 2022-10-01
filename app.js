require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// hashing and salting and authentication using passport
const session=require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
const  GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');



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
  password: String,
  googleId: String,
  secret:String
});

// Adding plugin to userSchema to hash and salt the password and save into mongodb
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// const secret = process.env.SECRET;
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
  done(null,user.id);
});

passport.deserializeUser(function(id,done){
  User.findById(id,function(err,user){
    done(err,user);
  });
});

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

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets", //google kahaan bhejega after authenticated from their server,this is the link where user will now get authenticated locally, same as google developer mai jo url daala hai
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo" //we are no longer be reteriving from google+ account which has been deprecated , now it will get information from userinfo
  },
  // Google sends back access token which allows us to get data
  function(accessToken, refreshToken, profile, cb) {
    // profile will contain email,googleid
    /*
    So now, when the user clicks on that button that says "Sign up with Google", it will hit up the /auth/

google route which gets caught over here and that will initiate authentication on Google's servers asking

them for the user's profile once they've logged in.

Now once that's been successful, Google will redirect the user back to our website and make a get request

to /auth/google/secrets. And it's at this point where we will authenticate them locally and save

their login session.

Now once they've been successfully authenticated, we take them to /secrets.

But at this stage, the Google authentication has already completed and this callback function gets triggered.
*/
    console.log(profile);
    // This callback function will get triggered when we sign in using google and trying to store them in our userDB
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      // finding googleId in user DB
      return cb(err, user);
    });
  }
));


// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res){
  res.render("home");
});

app.get("/auth/google",
  // initiate authentication with google
  // use passport to authenticate using GoogleStrategy and when we hit google we tell them we want their profile(email,googleid)
  passport.authenticate("google", { scope: ['profile'] })
  // brings a pop up to sign into google
);

// This is made by google where we will authenticate the user locally
app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets",function(req,res){
  // Check if the user is authenticated (already logged in - simply render the secrets page)
  // Publish all the secrets
  // find all the user having secret value exists
  User.find({"secret":{$ne:null}},function(err,foundUsers){
    if(err){
      console.log(err);
    }else{
      if(foundUsers){
        res.render("secrets",{usersWithSecrets:foundUsers});
      }
    }
  });
});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){
  const submittedSecret=req.body.secret;
  // finding the current user in the database
  // passport will save the details in req.user
  // const req.user.id
  User.findById(req.user.id,function(err,foundUser){
    if(err){console.log(err);}
    else{
      if(foundUser){
        foundUser.secret=submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
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
