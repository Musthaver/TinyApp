const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
    b6UTxQ: { longURL: "https://www.tsn.ca", userID: "user2RandomID" },
    i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" },
    slides: { longURL: "https://www.google.ca", userID: "userRandomID" },
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
    return  Math.random().toString(36).substring(7); 
}  

const addOrEditDb = (key, value, userID) => {
    urlDatabase[key] = {
        longURL: value,
        userID: userID
};

const addUser = (userEmail, userPassword) => {
    const userID = generateRandomString();
    users[userID] = {
        id: userID,
        email: userEmail,
        password: userPassword,
    }
    return userID;
}

const checkEmailExists = (userEmail) => {
    for (const key in users) {
        if (users[key].email === userEmail) {
            return users[key];
        }
    }
    return false;    
}

const urlsForUser = (userID) => {
    const userUrls = {};
    for (const key in urlDatabase) {
        if (urlDatabase[key].userID === userID.id) {
            userUrls[key] = urlDatabase[key];
        }
    }
    return userUrls;
}

const checkPassword = (userEmail, userPassword) => {
    const user = checkEmailExists(userEmail);

    if (user && user.password === userPassword) {
        return user.id;
    } else {
        return false;
    }
}

const getCurrentUser = req => {
    // read the user id from the cookies
    const userId = req.cookies['user_id'];
    // return the user from usersDb with that id
    return users[userId];
};


app.get("/", (req, res) => {
  res.redirect("/urls/new");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
    const userID = getCurrentUser(req);
    const templateVars = {currentUser: getCurrentUser(req)};
    if (userID) {
        res.render("urls_new", templateVars);
    } else {
        res.send("You must be a registered user to access this page. Please <a href=/login>Login</a> to proceed.");
    }
});

app.get("/urls", (req, res) => {
    const userID = getCurrentUser(req);

    if (userID) {
        const templateVars = {urls: urlsForUser(userID), currentUser: getCurrentUser(req)};
        res.render("urls_index", templateVars);
    } else {
        res.send("You must be a registered user to access this page. Please <a href=/login>Login</a> to proceed.");
    }
});

app.post("/urls", (req, res) => {
    const userId = req.cookies['user_id'];
    const {longURL} = req.body;
    const shortURL = generateRandomString();
    addOrEditDb(shortURL, longURL, userId);
    res.redirect(`/urls/${shortURL}`)        
});

app.get("/login", (req, res) => {
    const templateVars = {urls: urlDatabase, currentUser: getCurrentUser(req)};
    res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
    const {email, password} = req.body;
    const userID = checkPassword(email, password);

    if (!checkEmailExists(email)) {
        res.status(403).send('Error 403: Sorry, could not find that email address. Please register.');
    } else if (!userID) {
        res.status(403).send('Error 403: Sorry, wrong password, please try again.')
    } else {
        res.cookie("user_id", userID);
        res.redirect("/urls"); 
    }
});

app.post("/logout", (req, res) => {
    res.clearCookie("user_id");
    res.redirect("/urls"); 
});

app.get("/register", (req, res) => {
    const templateVars = {currentUser: getCurrentUser(req)};
    res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        res.status(400).send('Error 400: please return to the <a href=/register>Registration page</a> and provide a valid email and password');
    } else if (checkEmailExists(email)) {
        res.status(400).send('Error 400: You are already registered. Please <a href=/login>Login</a>.');
    } else {
        const userID = addUser(email, password);
        res.cookie("user_id", userID);
        res.redirect("/urls"); 
    }
});

app.get("/urls/:shortURL", (req, res) => {
    const userID = getCurrentUser(req);
    console.log(userID);

    if (!userID) {    
        res.status(401).send("You must be a registered user to access this page. Please <a href=/login>Login</a> to proceed.");
    } else {
        const userUrls = urlsForUser(userID); 
        console.log(userUrls);
        console.log(req.params.body);
        if (!userUrls.hasOwnProperty(req.params.shortURL)) {
            res.send("Please enter a valid TinyURL address. To see all your TinyURLs, click <a href=/urls>here</a>.")
        } else {
            const templateVars = { 
                shortURL: req.params.shortURL, 
                longURL: urlDatabase[req.params.shortURL].longURL,
                currentUser: getCurrentUser(req)
            };
            res.render("urls_show", templateVars);
        } 
    }       
});

app.post("/urls/:shortURL", (req, res) => {
    const userID = getCurrentUser(req);

    if (!userID) {    
        res.status(401).send("You must be a registered user to access this page. Please <a href=/login>Login</a> to proceed.");
    } else {
        const userUrls = urlsForUser(userID);   
        if (!userUrls.hasOwnProperty(req.params.shortURL)) {
            res.send("Please enter a valid TinyURL address. To see all your TinyURLs, click <a href=/urls>here</a>.")
        } else {    
            const {longURL} = req.body;
            const {shortURL} = req.params;
            addOrEditDb(shortURL, longURL, userID);
            res.redirect("/urls");
        }  
    }            
});

app.post("/urls/:shortURL/delete", (req, res) => {
    const userID = getCurrentUser(req);

    if (!userID) {    
        res.status(401).send("You must be a registered user to access this page. Please <a href=/login>Login</a> to proceed.");
    } else {
        const userUrls = urlsForUser(userID);   
        if (!userUrls.hasOwnProperty(req.params.shortURL)) {
            res.send("Please enter a valid TinyURL address. To see all your TinyURLs, click <a href=/urls>here</a>.")
        } else {
            const {shortURL} = req.params;
            delete urlDatabase[shortURL];
            res.redirect("/urls");
        }
    }    
});

app.get("/u/:shortURL", (req, res) => {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});