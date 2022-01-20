// Create express app
let express = require("express");
let app = express();
let db = require("./database.js");
let md5 = require("md5");

let bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



// Server port
let HTTP_PORT = 3000;
// Start server
app.listen(HTTP_PORT, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",HTTP_PORT))
});
// Root endpoint
app.get("/api/v1", (req, res, next) => {
    res.json({"message":"API V1 - Fake API"})
});


app.get("/api/v1/users", (req, res, next) => {
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


app.get("/api/v1/user/:id", (req, res, next) => {
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



app.post("/api/v1/user/", (req, res, next) => {
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


app.get("/api/v1/players", (req, res, next) => {
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



app.get("/api/v1/balance/player/:id", (req, res, next) => {
    let sql = "select balance from  wallet where player_id = ? ORDER BY id DESC LIMIT 1";
    let params = [req.params.id];
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








// Insert here other API endpoints

// Default response for any other request
app.use(function(req, res){
    res.status(404);
});
