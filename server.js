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
// let HTTP_PORT = 3000;
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
            }
            resolve(row.balance);
        });
    })
}


app.post("/withdrawAndDeposit", async (req, res, next) => {

    let player_id = req.body.playerId;
    let type_operation = req.body.type_operation;
    let balance;
    let balanceNew;
    balance = await getBalance(player_id);

    if (parseInt(type_operation) === CREDIT) {
        balanceNew = (parseFloat(balance) + parseFloat(req.body.amount)).toFixed(1);
    }

    if (parseInt(type_operation) === DEBIT) {
        balanceNew = (parseFloat(balance) - parseFloat(req.body.amount)).toFixed(1);
    }

    balanceNew = parseFloat(balanceNew);

    console.log(balanceNew, balance, type_operation, req.body.amount);

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
                    "newBalance": balanceNew,
                    "transactionRef": req.body.transaction
                }
            })
        });
    }
});

app.get("/deposit", (req, res, next) => {
    res.json({"message":"Deposit"})
});







// Insert here other API endpoints

// Default response for any other request
app.use(function(req, res){
    res.status(404);
});


