/**
 * Trident SSO
 * Ports:
 *  FrontEnd    8080
 *  API         8081
 *  WebSockets  9090
 */

//  Filesystem Loading
const fs = require('fs');

// Redis Connection
const   redis = require("redis"),
        client = redis.createClient(); 

// MySQL Connection
const mysql      = require('mysql');
const conn = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'root',
    password : 'Password12345',
    database : 'TridentX-SSO'
});

// Redis Session
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

// WebSite + API + WebSockets
const app = require('express')();
// Redis Session Caching
let sessionParser = session({
    store: new RedisStore({
        client: client
    }),
    saveUninitialized: false,
    secret: 'keyboard catzz',
    resave: false
});
app.use(sessionParser);

const api = require('express')();
const WebSocket = require('ws');
const wss = new WebSocket.Server({ 
    port: 9090, 
    verifyClient: (info, done) => {
        console.log('Parsing session from request...');
        sessionParser(info.req, {}, () => {
        console.log('Session is parsed!');
        //
        // We can reject the connection by returning false to done(). For example,
        // reject here if user is unknown.
        //
        // done(info.req.session.userId);
        done(true);
    });} 
});

// Verification
const NodeRSA = require('node-rsa');
const key = new NodeRSA(fs.readFileSync("./PrivateKey.pem", {encoding: "utf8"}), 'pkcs1', {encryptionScheme: 'pkcs1'});

// Password Hashing
const bcrypt = require('bcrypt');

/**
 * (WS) WebSockets
 */

wss.on('connection', function connection(ws, req) {
    console.log(req.session);
    let a = guidGenerator();
    console.log(a);
    req.session.e = a;
    console.log(req.session);
    ws.on('message', function incoming(message) {
    // Debug Show All
    console.log('received: %s', message);
    console.log(req.session.test);
    // Decode Message
    let m = JSON.parse(message);
    switch (m.Type) {
        case "Credentials":
            console.log(`Decrypting Credentials`);
            let c = key.decrypt(m.Payload.Data, 'utf8');
            c = JSON.parse(c);
            console.log(c);
            // Tell Client we are processing the data
            ws.send(JSON.stringify({Timestamp: Date.now(), Type: "Message", Security: {Enabled: false, Type: undefined, SecurityCode: 0x000}, Payload: {Data: {Message: "Processing Credentials", Code: 0x1A}, Checksum: undefined}}));
            // Query DB for User
            conn.connect((err) => {
                conn.query(`SELECT * FROM \`TridentX-SSO\`.user WHERE \`username\` LIKE "${c.Username}"`, function (err, result) {
                    if (err) throw err;
                    // console.log(result[0]); Debug
                    if(bcrypt.compareSync(c.Password, result[0].password)) {
                        // Passwords match
                        // console.log(`Passwords Match`); Debug
                        ws.send(JSON.stringify({Timestamp: Date.now(), Type: "Authorized", Security: {Enabled: false, Type: undefined, SecurityCode: 0x000}, Payload: {Data: {Username: result[0].username, Email: result[0].email}, Checksum: undefined}}));
                        // Store Auth in Express Session
                        req.session.userInfo = c.Username;
                        console.log(req.session);
                    } else {
                        // Passwords don't match
                        // console.log(`Passwords do not match`) Debug
                        ws.send(JSON.stringify({Timestamp: Date.now(), Type: "Message", Security: {Enabled: false, Type: undefined, SecurityCode: 0x000}, Payload: {Data: {Message: "Credentials Invalid", Code: 0x1C}, Checksum: undefined}}));
                    }
                });
            });
            break;
    
        default:
            break;
    }
    });

    ws.send('something');
});

/**
 * (Express) Sessions Handling
 */

app.use(function (req, res, next) {

    // Check if client has a session
    if (!req.session) {
        // No Session? throw error
        return next(new Error('oh no')) // handle error
    }
    // // Check if Client has a user in the session
    // if(!req.session.userInfo){
    //     req.session.userInfo = {};
    // }
       // Check if Client has a user in the session
    if(!req.session.e){
        let a = guidGenerator();
        console.log(a);
        req.session.e = a;
    }

    next() // otherwise continue
});

/**
 * (Express) Front end settings
 */

app.use(require('express').static(__dirname + "/views"));

/**
 * (Express) API settings
 */

api.use(require('express').json());

/**
 * (Express) Front end routes 
 */

app.get('/sso', (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

/**
 * (Express) Front end routes 
 */

app.get('/auth', (req, res) => {
    console.log(req.session);
    console.log(req.session.userInfo);
    res.send(`Username: ${req.session.userInfo}`);
});

/**
 * (Express) API routes
 */

api.get('/', (req, res) => {
    res.send("OKAY - 200");
});

api.get('/data/:user', (req, res) => {
    // Get JSON request
    console.log(`URL Parameters: ${req.params.user}`);
    console.log(`Query String: ${req.query.client}`);
    res.send("OKAY - 200");
});

api.post('/auth', (req, res) => {
    // Get JSON request
    console.log(`Query String: ${req.body}`);
    console.log(req.body);
    // let decryptedPassword = key.decrypt(req.body.Password, 'utf8');
    // console.log(decryptedPassword);
    let hash = bcrypt.hashSync(req.body.Password, 10);
    console.log(hash);
    if(bcrypt.compareSync(req.body.Password, hash)) {
        // Passwords match
        console.log(`Passwords Match`);
    } else {
        // Passwords don't match
        console.log(`Passwords do not match`)
    }
    res.json({Status: 200, Server: "Bindserver R&D Lab"});
});

api.post('/verify', (req, res) => {
    // Get JSON request
    console.log(`Query String: ${req.body}`);
    console.log(req.body);
    let decryptedPassword = key.decrypt(req.body.Password, 'utf8');
    console.log(decryptedPassword);
    res.json({Status: 200, Server: "Bindserver R&D Lab", Data: { Crypto: true, isValid: true }});
});

/**
 * Express Port Listen
 */

api.listen(8081, () => {
    console.log(`Serving API at port 8081`);
});

app.listen(8080, () => {
    console.log(`Serving WebFront at port 8080`);
});


// DEBUGGING 
function guidGenerator() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4() + S4());
}