const express = require('express');
var fs = require('fs')
var https = require('https')
const app = express();
var bodyParser = require('body-parser');

const { auth, requiresAuth } = require('express-openid-connect');
const dotenv = require('dotenv');
dotenv.config();

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,
    baseURL: process.env.APP_URL || process.env.BASEURL,
    clientID: process.env.CLIENTID,
    issuerBaseURL: process.env.ISSUER
};

app.use(express.static('public'));
app.set('view engine', 'ejs');
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

var users = [];
let counter = 0;

app.get('/',  function (req, res) {
    req.user = {
        isAuthenticated : req.oidc.isAuthenticated()
    };
    if (req.user.isAuthenticated) {
        req.user.name = req.oidc.user.name;
    }
    res.render('index', {user : req.user, users : users});
});

app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

app.post('/getUserData', requiresAuth(),(req, res) => {
    users[counter++] = {
        nickname: req.oidc.user.nickname,
        timestamp: req.oidc.user.update_at,
        latitude: req.body.position.latitude,
        longitude: req.body.position.longitude
    }
    req.user = {
        isAuthenticated : req.oidc.isAuthenticated()
    };
    if (req.user.isAuthenticated) {
        req.user.name = req.oidc.user.name;
    }
    console.log(users)
    res.render('index', {user : req.user, users : users});
});


app.get("/sign-up", (req, res) => {
    res.oidc.login({
        returnTo: '/',
        authorizationParams: {
            screen_hint: "signup",
        },
    });
});

const port = process.env.PORT || 4010;
app.set("port", port);
if(process.env.PORT){
    app.listen(port, () => console.log("Server runing"))
}else{
    https.createServer({
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.cert')
    }, app)
        .listen(port, function () {
            console.log(`Server running at https://localhost:${port}/`);
        });
}
