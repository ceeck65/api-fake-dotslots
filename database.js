var sqlite3 = require('sqlite3').verbose()
var md5 = require('md5')
const DBSOURCE = "database.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message)
        throw err
    }else{
        console.log('Connected to the SQLite database.')
        db.run(`CREATE TABLE user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name text,
            email text UNIQUE,
            password text,
            CONSTRAINT email_unique UNIQUE (email)
            )`,
            (err) => {
                if (err) {
                    // Table already created
                }else{
                    // Table just created, creating some rows
                    var insert = 'INSERT INTO user (name, email, password) VALUES (?,?,?)'
                    db.run(insert, ["admin","admin@example.com",md5("admin123456")])
                    db.run(insert, ["user","user@example.com",md5("user123456")])
                    db.run(insert, ["player","player@example.com",md5("123456")])
                    db.run(insert, ["player 2","player2@example.com",md5("123456")])
                }
            });

        db.run(`CREATE TABLE players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_nane text,
            user_id INTEGER
            )`,
            (err) => {
                if (err) {
                    // Table already created
                }else{
                    // Table just created, creating some rows
                    var insert = 'INSERT INTO players (user_nane, user_id) VALUES (?,?)'
                    db.run(insert, ["player_1",3])
                    db.run(insert, ["player_2",4])
                }
            });


        db.run(`CREATE TABLE wallet (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER, 
            balance NUMERIC, 
            amount NUMERIC, 
            transaction_type INTEGER
            )`,
            (err) => {
                if (err) {
                    // Table already created
                }else{
                    // Table just created, creating some rows
                    var insert = 'INSERT INTO wallet (player_id, balance, amount, transaction_type) VALUES (?,?,?,?)'
                    db.run(insert, [1,10,10, 1])
                    db.run(insert, [1,20,20, 2])
                }
            });
        console.log('Tables created.')
    }
});


module.exports = db
