// Create express app
let express = require("express");
let app = express();
let db = require("./database.js");
let md5 = require("md5");

let bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let balancePlayer;
const CREDIT = 1;
const DEBIT = 2;


// Server port
let HTTP_PORT = process.env.PORT;
// let HTTP_PORT = 3005;
// Start server
app.listen(HTTP_PORT, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",HTTP_PORT))
});
// Root endpoint
app.get("/", (req, res, next) => {
    res.json({"message":"API V1 - Fake API"})
});


app.get("/users", (req, res, next) => {
    let sql = "select * from user";
    let params = [];
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
    });
});


app.get("/user/:id", (req, res, next) => {
    let sql = "select * from user where id = ?";
    let params = [req.params.id];
    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({
            "message":"success",
            "data":row
        })
    });
});



app.post("/user/", (req, res, next) => {
    let errors = [];
    if (!req.body.password){
        errors.push("No password specified");
    }
    if (!req.body.email){
        errors.push("No email specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    const data = {
        name: req.body.name,
        email: req.body.email,
        password: md5(req.body.password)
    };
    const sql = 'INSERT INTO user (name, email, password) VALUES (?,?,?)';
    const params = [data.name, data.email, data.password];
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    });
})



// PLAYERS


app.get("/players", (req, res, next) => {
    let sql = "select * from players";
    let params = [];
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
    });
});


app.post("/players/", (req, res, next) => {
    let errors = [];
    if (!req.body.user_name){
        errors.push("No username specified");
    }
    if (!req.body.user_id){
        errors.push("No user id specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    const data = {
        user_name: req.body.user_name,
        user_id: req.body.user_id
    };
    const sql = 'INSERT INTO players (user_name, user_id) VALUES (?,?)';
    const params = [data.user_name, data.user_id];
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    });
})




app.get("/balance/player", (req, res, next) => {
    let playerId = req.query.playerId;
    let sql = "select balance from  wallet where player_id = ? ORDER BY id DESC LIMIT 1";
    let params = [playerId];
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({
            "result":rows
        })
    });
});


function getBalance(player_id) {
    return new Promise(resolve => {
        let sql = "select balance from  wallet where player_id = ? ORDER BY id DESC LIMIT 1";
        db.get(sql, player_id, (err, row) => {
            if (err) {
                return console.error(err.message);
            } else {
                if(typeof row == 'undefined') {
                    const data = {
                        player_id: player_id,
                        balance: 0,
                        amount: 0,
                        transaction_type: 0
                    };
                    const sql = 'INSERT INTO wallet (player_id, balance, amount, transaction_type) VALUES (?,?,?,?)';
                    const params = [data.player_id, data.balance, data.amount, data.transaction_type];
                    db.run(sql, params, function (err, result) {
                        if (err){
                            res.status(400).json({"error": err.message})
                            return;
                        }
                        resolve(data.balance);
                    });
                    resolve(data.balance);
                } else {
                    resolve(row.balance);
                }
            }
        });
    })
}


app.post("/withdrawAndDeposit", async (req, res, next) => {

    let player_id = req.body.playerId;
    let type_operation = req.body.type_operation;
    let bet = req.body.bet;
    let balance;
    let balanceNew;
    balance = await getBalance(player_id);

    balance = (parseFloat(balance) - parseFloat(bet));

    if (parseInt(type_operation) === CREDIT) {
        balanceNew = (parseFloat(balance) + parseFloat(req.body.amount)).toFixed(1);
    }

    if (parseInt(type_operation) === DEBIT) {
        balanceNew = (parseFloat(balance) - parseFloat(req.body.amount)).toFixed(1);
    }

    balanceNew = parseFloat(balanceNew);

    if (!isNaN(balanceNew)) {
        const sql = 'INSERT INTO wallet (player_id, balance, amount, transaction_type) VALUES (?,?,?,?)';
        const params = [player_id, balanceNew, req.body.amount, type_operation];
        db.run(sql, params, function (err, result) {
            if (err) {
                res.status(400).json({"error": err.message})
                return;
            }
            res.json({
                "status": 200,
                "message": "success",
                "response": {
                    "balance": balanceNew,
                    "transactionRef": req.body.transaction
                }
            })
        });
    }
});

function getPlayers(player_id) {
    return new Promise(resolve => {
        let sql = "select * from  players where id = ? ORDER BY id DESC LIMIT 1";
        db.get(sql, player_id, (err, row) => {
            if (err) {
                return console.error(err.message);
            } else {
                resolve(row);
            }
        });
    })
}

app.post("/auth/player", async (req, res, next) => {
    let playerId = parseInt(req.body.playerId);
    let players = await getPlayers(playerId);
    let balance = await getBalance(playerId);

    res.json({
        "status": 200,
        "message": "success",
        "response": {
            "user": {
                "user_id": players.id,
                "username": players.user_name,
                "country": "US"
              },
              "wallet": {
                "balance": balance,
                "currency": "USD"
              }
        }
    })
  
});


// Insert here other API endpoints

// Default response for any other request
app.use(function(req, res){
    res.status(404);
});


