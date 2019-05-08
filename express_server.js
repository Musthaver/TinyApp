const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
    "userRandomID": {
      id: "userRandomID", 
      email: "user@example.com", 
      password: "purple-monkey-dinosaur"
    },
   "user2RandomID": {
      id: "user2RandomID", 
      email: "user2@example.com", 
      password: "dishwasher-funk"
    }
}

const generateRandomString = () => {
    let shortURL = Math.random().toString(36).substring(7);
    return shortURL;
}  

const addOrEditDb = (key, value) => {
    urlDatabase[key] = value;
};

const addUser = (userID, userEmail, userPassword) => {
    users[userID] = {
        id: userID,
        email: userEmail,
        password: userPassword,
    }
    return users;
}

const checkEmailExists = (userEmail) => {
    for (const key in users) {
        if (users[key].email === userEmail) {
            console.log(users[key].email);
            return true;
        }
    }
    return false;    
}

const getID = (userEmail) => {
    for (const key in users) {
        if (users[key].email === userEmail) {
            return users[key].id;
        }
    }
}

const checkPassword = (userEmail, userPassword) => {
    for (const key in users) {
        if (users[key].email === userEmail && users[key].password === userPassword) {
            return true;

        }
    }
    return false;
}

app.get("/", (req, res) => {
  res.redirect("/urls/new");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
 res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
    let templateVars = {userID: req.cookies["user_id"], users: users};
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
    const long = req.body.longURL;
    const short = generateRandomString();
    addOrEditDb(short, long);
    res.redirect(`/urls/${short}`)        
});

app.get("/urls", (req, res) => {
    let templateVars = {urls: urlDatabase, userID: req.cookies["user_id"], users: users};
    res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {
    
    res.render("urls_login");
});

app.post("/login", (req, res) => {
    let userEmail = req.body.email;
    let userPassword = req.body.password;
    if (!checkEmailExists(userEmail)) {
        res.status(403).send('Error 403: Sorry, could not find that email address. Please register.');
    }    
    if (checkPassword(userEmail, userPassword) === false) {
        res.status(403).send('Error 403: Sorry, wrong password, please try again.')
    } else {
        let userID = getID(userEmail);
        res.cookie("user_id", userID);
        res.redirect("/urls"); 
    }
});

app.post("/logout", (req, res) => {
    res.clearCookie("username");
    res.redirect("/urls"); 
});

app.get("/register", (req, res) => {
    let templateVars = {userID: req.cookies["user_id"], users: users};
    res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
    let userID = generateRandomString();
    let userEmail = req.body.email;
    let userPassword = req.body.password;

    if (!userEmail || !userPassword) {
        res.status(400).send('Error 400: please provide a valid email and password');
    } else if (checkEmailExists(userEmail)) {
        res.status(400).send('Error 400: You are already registered. Please login');
    } else {
        addUser(userID, userEmail, userPassword);
        let UserID = getID(userEmail)

        res.cookie("user_id", UserID);
        res.redirect("/urls"); 
    }
});

app.post("/urls/:shortURL", (req, res) => {
    const long = req.body.longURL;
    const short = req.params.shortURL
    addOrEditDb(short, long);
    res.redirect("/urls");        
});

app.post("/urls/:shortURL/delete", (req, res) => {
    let toDelete = req.params.shortURL;
    delete urlDatabase[toDelete];
    res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { 
      shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL],
      userID: req.cookies["user_id"], 
      users: users
    };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
    const longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});