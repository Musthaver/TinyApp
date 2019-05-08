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

const generateRandomString = () => {
    let shortURL = Math.random().toString(36).substring(7);
    return shortURL;
}  

const addOrEditDb = (key, value) => {
    urlDatabase[key] = value;
};

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
    let templateVars = {
        username: req.cookies["username"],
    };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
    const long = req.body.longURL;
    const short = generateRandomString();
    addOrEditDb(short, long);
    res.redirect(`/urls/${short}`)        
});

app.get("/urls", (req, res) => {
    let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
    res.render("urls_index", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
    const long = req.body.longURL;
    const short = req.params.shortURL
    addOrEditDb(short, long);
    res.redirect("/urls");        
});

app.post("/login", (req, res) => {
    let username = req.body.username;
    res.cookie("username", username);
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
      username: req.cookies["username"]
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