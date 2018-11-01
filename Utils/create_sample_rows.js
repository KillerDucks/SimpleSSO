// MySQL Connection
const mysql      = require('mysql');
const connection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'root',
  password : 'Password12345',
  database : 'TridentX-SSO'
});

// Password Hashing
const bcrypt = require('bcrypt');

// let hash = bcrypt.hashSync(req.body.Password, 10);

// connection.connect((err) => {
//     if (err) throw err;
//     console.log(`Connected !!!`);
//     // Flush Data into DB
//     connection.query("SELECT * FROM `TridentX-SSO`.user", function (err, result) {
//         if (err) throw err;
//         console.log("Result: " + result);
//     });

//     connection.query(`SELECT * FROM \`TridentX-SSO\`.user`, function (err, result) {
//         if (err) throw err;
//         console.log("Result: " + result);
//     });
// });

// INSERT INTO `TridentX-SSO`.`user` (`user-id`, `username`, `email`, `password`) VALUES ('14fc23fb', 'Nexus', 'Nexus@bindserver.com', '$2b$10$fDC9oKZgQLPDCblmSXtrJOhYu/ZzoVhvACgbN1qdoxE2tqLD0w90C');
// INSERT INTO `TridentX-SSO`.`apps` (`service-id`, `service-name`, `service-types`) VALUES ('6767e159', 'Bindserver', 'auth,verify');

function guidGenerator() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4() + S4());
}

console.log(guidGenerator());
console.log(bcrypt.hashSync(`Password123`, 10));