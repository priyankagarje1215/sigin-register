const mysql = require('mysql2');
const dbConnection = mysql.createPool({
    host     : 'localhost', 
    user     : 'root',       
    password : '',   
    database : 'test_db'     
}).promise();
module.exports = dbConnection;