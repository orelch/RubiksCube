require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/cubeUsersDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    googleId: String,
    facebookId: String,
    leastSteps: Number,
    leastTime: {
        type: [Number],
        default: undefined
    }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/cube", 
//     userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({ username: profile.emails[0].value, googleId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));

app.get("/", function (req, res) {
    res.render("home");
});

app.route("/register")
    .get(function (req, res) {
        res.render("register");
    })

    .post(function (req, res) {
        User.register({ username: req.body.username }, req.body.password, function (err) {
            if (!err) {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/cube");
                });
            } else {
                console.log(err);
                res.redirect("/register");
            }
        });
    });

app.route("/login")
    .get(function (req, res) {
        res.render("login");
    })

    .post(function (req, res) {
        
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        passport.authenticate('local', function (err, user) {
            if (!err) {
                req.login(user, function (error) {
                    if (!error) {
                        res.redirect("/cube");
                    } else {
                        console.log(error);
                        res.redirect("/login");
                    }
                });
            } else {
                console.log(err);
                res.redirect("/login");
            }
          })(req, res);

        // req.login(user, function (error) {
        //     if (!error) {
        //         passport.authenticate("local")(req, res, function () {
        //             res.redirect("/cube");
        //         });
        //     } else {
        //         console.log(error);
        //         res.redirect("/login");
        //     }
        // });
    });

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

app.get("/guest", function (req, res) {
    req.logout();
    res.redirect("/cube");
})


app.route("/cube")
    .get(function (req, res) {
        if (req.user != undefined) {
            if (req.isAuthenticated()) {
                res.render("cube", {user: req.user});
            } else {
                res.redirect("/");
            }
        } else {
            res.render("cube", {user: req.user});
        }
    })

    .post(function (req, res) {
        var solveTime = req.body.solveTime;
        var solveSteps = req.body.solveSteps;

        if (req.user != undefined) {
            User.findById(req.user.id, function (err, foundUser) {
                if (!err) {
                    if (foundUser) {
                        var currentLeastTime = foundUser.leastTime;
                        var currentLeastSteps = foundUser.leastSteps;

                        if (currentLeastTime === undefined || currentLeastTime > solveTime) {
                            foundUser.leastTime = solveTime;
                        }
    
                        if (currentLeastSteps === undefined || currentLeastSteps > solveSteps) {
                            foundUser.leastSteps = solveSteps;
                        }

                        foundUser.save(function () {
                            res.redirect("/cube");
                        });
                    }
                } else {
                    console.log(err);
                }
            });
        }
    });

app.get("/results", function (req, res) {
    User.find({"leastTime": {$ne: undefined }, "leastSteps": {$ne: undefined }}, function (err, foundUsers) {
        var leastStepsArray = foundUsers.map(function (a) { return [a.username, a.leastSteps]; });
        var leastTimeArray = foundUsers.map(function (a) {
            var secTime = a.leastTime[0] * 60 + a.leastTime[1];
            return [a.username, secTime];
        });

        leastStepsArray.sort(function (a, b) { return a[1] - b[1]; });
        leastTimeArray.sort(function (a, b) { return a[1] - b[1]; });

        leastTimeArray = leastTimeArray.map(function (a) {
            return [a[0], [Math.floor(a[1] / 60), a[1] % 60]];
        });

        res.render("results", { bestTimes: leastTimeArray, leastSteps: leastStepsArray });
    });
});

app.listen(3000, function () {
    console.log("Server running on port 3000");
});