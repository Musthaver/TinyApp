const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
}));
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
      password: "$2b$10$mgOCTQHhSfta6Ex.V7XZ7uQ5/OU13m0EAe8yBTPz5zHiwijHIe0ve"
    },
   "user2RandomID": {
      id: "user2RandomID", 
      email: "user2@example.com", 
      password: "$2b$10$2blnRvJjogWWDFZg65eKQe4Xn9I.QdT7.QA5vgJ2menn.23ZvwMAW"
    }
}

const generateRandomString = () => {
    return  Math.random().toString(36).substring(7); 
}  

const addOrEditDb = (key, value, userID) => {
    urlDatabase[key] = {
        longURL: value,
        userID: userID.id
    }    
};

const addUser = (userEmail, userPassword) => {
    const userID = generateRandomString();
    const hashedPassword = bcrypt.hashSync(userPassword, 10);
    users[userID] = {
        id: userID,
        email: userEmail,
        password: hashedPassword
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
    const isValid = bcrypt.compareSync(userPassword, user.password);

    if (user && isValid) {
        return user.id;
    } else {
        return false;
    }
}

const getCurrentUser = req => {
    const userID = req.session.user_id;
    return users[userID];
};


app.get("/", (req, res) => {
    const userID = getCurrentUser(req);
    if (userID) {
        res.redirect("/urls");
    } else {
        res.redirect("/login");
    }    
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
    const userID = getCurrentUser(req);
    if (userID) {
        const templateVars = {urls: urlsForUser(userID), currentUser: getCurrentUser(req)};
        res.render("urls_index", templateVars);
    } else {
        const templateVars = {
            currentUser: getCurrentUser(req),
            error: 'You must be a registered user to access this page. Please login to proceed.'
        };
        res.status(401).render("urls_error", templateVars);
    }
});

app.post("/urls", (req, res) => {
    const userID = getCurrentUser(req);
    const longURL = req.body.longURL;
    const shortURL = generateRandomString();
    addOrEditDb(shortURL, longURL, userID);
    res.redirect(`/urls/${shortURL}`)        
});

app.get("/login", (req, res) => {
    const userID = getCurrentUser(req);
    if (userID) {
     res.redirect("/urls");
    } else {
    const templateVars = {urls: urlDatabase, currentUser: getCurrentUser(req)};
    res.render("urls_login", templateVars);
    }
});

app.post("/login", (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        const templateVars = {
            currentUser: getCurrentUser(req),
            error: 'Please return to the login page and provide a valid email and password.'
        };
        res.status(403).render("urls_error", templateVars);
    } else if (!checkEmailExists(email)) {
        const templateVars = {
            currentUser: getCurrentUser(req),
            error: 'Sorry, could not find that email address. Please register.'
        };
            res.status(403).render("urls_error", templateVars);
    } else {
        const userID = checkPassword(email, password);
        if (!userID) {
            const userID = checkPassword(email, password);
            const templateVars = {
                currentUser: getCurrentUser(req),
                error: 'Sorry, wrong password. Please try again.'
            }    
            res.status(403).render("urls_error", templateVars);
        } else {
            req.session.user_id = userID;
            res.redirect("/urls"); 
        }
    }    
});

app.post("/logout", (req, res) => {
    req.session = null;
    
    //leaving this here before it's a requirement
    res.redirect("/urls"); 

    //but I think it would make more sense to redirect the user to the login page after login out=
    // res.redirect("/login");
});

app.get("/register", (req, res) => {
    const userID = getCurrentUser(req);
    if (userID) {
        res.redirect("/urls");
    } else {
    const templateVars = {currentUser: getCurrentUser(req)};
    res.render("urls_register", templateVars);
    }
});

app.post("/register", (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        const templateVars = {
            currentUser: getCurrentUser(req),
            error: 'please return to the registration page and provide a valid email and password.'
        };
        res.status(400).render("urls_error", templateVars);
    } else if (checkEmailExists(email)) {
        const templateVars = {
            currentUser: getCurrentUser(req),
            error: 'You are already registered. Please login instead.'
        };
        res.status(400).render("urls_error", templateVars);
    } else {
        const userID = addUser(email, password);
        req.session.user_id = userID;
        res.redirect("/urls"); 
    }
});

app.get("/urls/new", (req, res) => {
    const userID = getCurrentUser(req);
    const templateVars = {currentUser: getCurrentUser(req)};
    if (userID) {
        res.render("urls_new", templateVars);
    } else {
        res.redirect("/login");
    }
});

app.get("/urls/:shortURL", (req, res) => {
    const userID = getCurrentUser(req);
    console.log(urlDatabase.hasOwnProperty(req.params.shortURL));


    if (urlDatabase.hasOwnProperty(req.params.shortURL) === false) {
        const templateVars = {
            currentUser: getCurrentUser(req),
            error: 'This page exists only in your imagination. Click <a href="/">here</a> to return to the homepage.'
        };
        res.render("urls_error", templateVars); 
    } else if (!userID) {  
        const templateVars = {
            currentUser: getCurrentUser(req),
            error: 'You must be a registered user to access this page. Please login or register to proceed.'
        };
        res.render("urls_error", templateVars);  
    } else {
        const userUrls = urlsForUser(userID); 

        if (!userUrls.hasOwnProperty(req.params.shortURL)) {
            const templateVars = {
                currentUser: getCurrentUser(req),
                error: 'Please enter a valid TinyURL address. To see all your TinyURLs, click <a href="/urls">here</a>.'
            };
            res.render("urls_error", templateVars);  
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
        const templateVars = {
            currentUser: getCurrentUser(req),
            error: 'You must be a registered user to access this page. Please login to proceed.'
        };
        res.status(401).render("urls_error", templateVars);   
    } else {
        const userUrls = urlsForUser(userID);   
        if (!userUrls.hasOwnProperty(req.params.shortURL)) {
            const templateVars = {
                currentUser: getCurrentUser(req),
                error: 'Please enter a valid TinyURL address. To see all your TinyURLs, click <a href="/urls">here</a>.'
            };
            res.render("urls_error", templateVars); 
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
        const templateVars = {
            currentUser: getCurrentUser(req),
            error: 'You must be a registered user to access this page. Please login to proceed.'
        };
        res.status(401).render("urls_error", templateVars); 
    } else {
        const userUrls = urlsForUser(userID);   
        if (!userUrls.hasOwnProperty(req.params.shortURL)) {
            const templateVars = {
                currentUser: getCurrentUser(req),
                error: 'Please enter a valid TinyURL address. To see all your TinyURLs, click <a href="/urls">here</a>.'
            };
            res.render("urls_error", templateVars); 
        } else {
            const {shortURL} = req.params;
            delete urlDatabase[shortURL];
            res.redirect("/urls");
        }
    }    
});

app.get("/u/:shortURL", (req, res) => {
    const shortURL = req.params.shortURL; 
    if (!urlDatabase.hasOwnProperty(req.params.shortURL)) {
        const templateVars = {
            currentUser: getCurrentUser(req),
            error: 'Please enter a valid TinyURL address. To see all your TinyURLs, click <a href="/urls">here</a>.'
        };
        res.render("urls_error", templateVars); 
    } else {
        const longURL = urlDatabase[req.params.shortURL].longURL;
        res.redirect(longURL);
    }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});