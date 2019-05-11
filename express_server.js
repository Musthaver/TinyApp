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
//generate string for userID and shortURL
const generateRandomString = () => {
    return  Math.random().toString(36).substring(7); 
}  

//add or edit a URL to the user's database
const addOrEditURL = (key, value, user) => {
    urlDatabase[key] = {
        longURL: value,
        userID: user.id
    }
};

//add a newly registered user to the users database
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

//verify if email provided exists in users database
const checkEmailExists = (userEmail) => {
    for (const key in users) {
        if (users[key].email === userEmail) {
            return users[key];
        }
    }
    return false;    
}

//filer the urlDatabase for a user's URLs
const urlsForUser = (user) => {
    const userUrls = {};
    for (const key in urlDatabase) {
        if (urlDatabase[key].userID === user.id) {
            userUrls[key] = urlDatabase[key];
        }
    }
    return userUrls;
}

//verify if password is valid(verifies if email even exists first)
const checkPassword = (userEmail, userPassword) => {
    const user = checkEmailExists(userEmail);

    if (user && bcrypt.compareSync(userPassword, user.password)) {
        return user.id;
    }
}

//requesting cookie 
const getCurrentUser = req => {
    return users[req.session.user_id];
};

//direct user to urls if logged in, to login if not
app.get("/", (req, res) => {
    const user = getCurrentUser(req);
    if (user) {
        res.redirect("/urls");
    } else {
        res.redirect("/login");
    }    
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

//display list of TinyURLs for the user if loggedin, if not error message
app.get("/urls", (req, res) => {
    const user = getCurrentUser(req);
    if (user) {
        const templateVars = {urls: urlsForUser(user), user: user};
        res.render("urls_index", templateVars);
    } else {
        const templateVars = {
            user: user,
            error: 'You must be a registered user to access this page. Please <a href="/login">login</a> to proceed.'
        };
        res.status(401).render("urls_error", templateVars);
    }
});

//add a url from /new
app.post("/urls", (req, res) => {
    const user = getCurrentUser(req);
    const {longURL} = req.body;
    const shortURL = generateRandomString();
    addOrEditURL(shortURL, longURL, user);
    res.redirect(`/urls/${shortURL}`)        
});

//login form, but if user is already logged on redirect to index
app.get("/login", (req, res) => {
    const user = getCurrentUser(req);
    if (user) {
        res.redirect("/urls");
    } else {
        const templateVars = {user: user};
        res.render("urls_login", templateVars);
    }
});

//login that verifies if fields are empty, if email exists, if password correct
app.post("/login", (req, res) => {
    const {email, password} = req.body;
    const templateVars = {user: getCurrentUser(req)};

    if (!email || !password) {
        templateVars.error = 'Please return to the <a href="/login">login</a> page and provide a valid email and password.'
        res.status(403).render("urls_error", templateVars);
    } else if (!checkEmailExists(email)) {
        templateVars.error = 'Sorry, could not find that email address. Please <a href="/register">register</a>.'
        res.status(403).render("urls_error", templateVars);
    } else {
        const userID = checkPassword(email, password);
        if (!userID) {
            const userID = checkPassword(email, password);
            templateVars.error = 'Sorry, wrong password. Please <a href="/login">try again</a>.' 
            res.status(403).render("urls_error", templateVars);
        } else {
            req.session.user_id = userID;
            res.redirect("/urls"); 
        }
    }    
});

//logout clear cookies and redirect to index
app.post("/logout", (req, res) => {
    req.session = null; 
    res.redirect("/urls"); 
});

//redirect to index unless already logged in
app.get("/register", (req, res) => {
    const user = getCurrentUser(req);
    if (user) {
        res.redirect("/urls");
    } else {
        const templateVars = {user: user};
        res.render("urls_register", templateVars);
    }
});

//registration. verifies fields have values, if email exists, adds user
app.post("/register", (req, res) => {
    const {email, password} = req.body;
    const templateVars = {user: getCurrentUser(req)};

    if (!email || !password) {
        templateVars.error = 'please return to the <a href="/register">registration page</a> and provide a valid email and password.'
        res.status(400).render("urls_error", templateVars);
    } else if (checkEmailExists(email)) {
        templateVars.error = 'You are already registered. Please <a href="/login">login</a> instead.'
        res.status(400).render("urls_error", templateVars);
    } else {
        const userID = addUser(email, password);
        req.session.user_id = userID;
        res.redirect("/urls"); 
    }
});

//redirect to login if user not loggedin
app.get("/urls/new", (req, res) => {
    const user = getCurrentUser(req);
    const templateVars = {user: user};
    if (user) {
        res.render("urls_new", templateVars);
    } else {
        res.redirect("/login");
    }
});

//if :short exists, if user logged on, if :short belongs to user, show :short page
app.get("/urls/:shortURL", (req, res) => {
    const user = getCurrentUser(req);
    const templateVars = {user: user};

    if (urlDatabase.hasOwnProperty(req.params.shortURL) === false) {
        templateVars.error = 'This page exists only in your imagination. Click <a href="/">here</a> to return to the homepage.'
        res.render("urls_error", templateVars); 
    } else if (!user) {  
        templateVars.error = 'You must be a registered user to access this page. Please <a href="/login">login</a> or <a href="/register">register</a> to proceed.'
        res.render("urls_error", templateVars);  
    } else {
        const userUrls = urlsForUser(user); 

        if (!userUrls.hasOwnProperty(req.params.shortURL)) {
            templateVars.error = 'Please enter a valid TinyURL address. To see all your TinyURLs, click <a href="/urls">here</a>.'
            res.render("urls_error", templateVars);  
        } else {
            templateVars.shortURL = req.params.shortURL, 
            templateVars.longURL = urlDatabase[req.params.shortURL].longURL,
            res.render("urls_show", templateVars);
        } 
    }       
});

//if user is logged in, if url belongs to user, edits the long URL
app.post("/urls/:shortURL", (req, res) => {
    const user = getCurrentUser(req);
    const templateVars = {user: user};

    if (!user) { 
        templateVars.error = 'You must be a registered user to access this page. Please <a href="/login">login</a> to proceed.'
        res.status(401).render("urls_error", templateVars);   
    } else {
        const userUrls = urlsForUser(user);   
        if (!userUrls.hasOwnProperty(req.params.shortURL)) {
            templateVars.error = 'Please enter a valid TinyURL address. To see all your TinyURLs, click <a href="/urls">here</a>.'
            res.render("urls_error", templateVars); 
        } else {    
            const {longURL} = req.body;
            const {shortURL} = req.params;
            addOrEditURL(shortURL, longURL, user);
            res.redirect("/urls");
        }  
    }            
});

//verify user, if url belongs to user, delets url and redirects
app.post("/urls/:shortURL/delete", (req, res) => {
    const user = getCurrentUser(req);
    const templateVars = {user, user};

    if (!user) {    
        templateVars.error = 'You must be a registered user to access this page. Please <a href="/login">login</a> to proceed.'
        res.status(401).render("urls_error", templateVars); 
    } else {
        const userUrls = urlsForUser(user);   
        if (!userUrls.hasOwnProperty(req.params.shortURL)) {
            templateVars.error = 'Please enter a valid TinyURL address. To see all your TinyURLs, click <a href="/urls">here</a>.'
            res.render("urls_error", templateVars); 
        } else {
            const {shortURL} = req.params;
            delete urlDatabase[shortURL];
            res.redirect("/urls");
        }
    }    
});

//verifies shorturl is in DB, redirects to longurl
app.get("/u/:shortURL", (req, res) => {
    const {shortURL} = req.params; 
    
    if (!urlDatabase.hasOwnProperty(shortURL)) {
        const templateVars = {
            user: getCurrentUser(req),
            error: 'Please enter a valid TinyURL address. To see all your TinyURLs, click <a href="/urls">here</a>.'
        };
        res.render("urls_error", templateVars); 
    } else {
        const {longURL} = urlDatabase[shortURL];
        res.redirect(longURL);
    }
});

//running
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});