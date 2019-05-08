const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = () => {
    let shortURL = Math.random().toString(36).substring(7);
    return shortURL;
}  

const addPropToDb = (key, value) => {
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
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
    const long = req.body.longURL;
    const short = generateRandomString();
    addPropToDb(short, long);
    res.redirect(`/urls/${short}`)        
});

app.get("/urls", (req, res) => {
    let templateVars = { urls: urlDatabase };
    res.render("urls_index", templateVars);
});
// delete?
app.post("/urls/:shortURL/delete", (req, res) => {
    let toDelete = req.params.shortURL;
    delete urlDatabase[toDelete];
    res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
    const longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});