const mysql = require("mysql2");
const express = require("express");
const bodyParser = require("body-parser"); 
const app = express();
const jsonParser = express.json();
const urlencodedParser = bodyParser.urlencoded({extended: false});
const cors = require('cors');
const fs = require('fs');
const pool = mysql.createPool({
  connectionLimit: 10,
  database: 'kateplan_plants',
  host: "localhost",
  user: "kateplan_admin",
  password: "дфтф4ьу",
});

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname   + "/" ));

app.set("view engine", "hbs");

 
// получение списка пользователей
app.get("/users", function(req, res){
    pool.query("SELECT * FROM users", function(err, data) {
      if(err) return console.log(err);
      res.render("users.hbs", {
          users: data
      });
    });
});

app.get('/main', function (req, res) { 
  pool.query("select * FROM curuser",  function(err, data) {
      if(err) return console.log(err);
      res.render("main.hbs", {
        curuser:data
      }); 
 });
});

app.post("/main", urlencodedParser, function (req, res) {
  
  pool.query("DELETE FROM curuser",function(err,data){
          if(err) return console.log(err);
  });
  res.redirect("back");
});

app.get('/table', function (req, res) { 
  pool.query("select * FROM curuser",  function(err, data) {
      if(err) return console.log(err);
      res.render("table.hbs", {
        curuser:data
      }); 
 });
});

app.get('/news', function (req, res) { 
      res.render("news.hbs"); 
});

app.get('/', function (req, res) {  
   res.render("logIn.hbs");  
});  

app.post("/", urlencodedParser, function (req, res) {
         
    if(!req.body) return res.sendStatus(400);
    let firstName = req.body.firstName;
    let secondName = req.body.secondName;
    let logIn = req.body.logIn;
    let password = req.body.password;

    pool.query("select * FROM users WHERE (logIn = ?) AND (password = ?)", [logIn, password],  function(err, data) {
        if(err) return console.log(err);
        curUserId = data[0].usersId;
        login = data[0].logIn;
        role = data[0].role;
        pool.query("DELETE FROM curuser",function(err,data){
          if(err) return console.log(err);
        });
       

        fs.writeFileSync(__dirname   + '/data.json', JSON.stringify(({curUserId, login, role}), null, 1));
        fs.readFile(__dirname   + '/data.json', 'utf8', function (err, data) {
          if (err) {console.log(err)}; 
          var data = JSON.parse(data);     
          let curUserId = data.curUserId;
          console.log(curUserId);
          let login = data.login;
          let role = data.role;
          pool.query("INSERT INTO curuser (curUserId, logIn, role) VALUES (?,?,?)", [curUserId, logIn, role],  function(err, data) {
              if(err) return console.log(err);
              res.redirect("/main");
          });
      }) 
    });   
  });

// возвращаем форму для добавления данных
app.get("/registration", function(req, res){
    res.render("registration.hbs");
});

// получаем отправленные данные и добавляем их в БД 
app.post("/registration", urlencodedParser, function (req, res) {
         
    if(!req.body) return res.sendStatus(400);
    let firstName = req.body.firstName;
    let secondName = req.body.secondName;
    let logIn = req.body.logIn;
    let password = req.body.password;
    let role = 'user';

    pool.query("INSERT INTO users (firstName, secondName, logIn, password, role) VALUES (?,?,?,?,?)", [firstName, secondName, logIn, password, role],  function(err, data) {
      if(err) return console.log(err);
      res.redirect("/login");
    });
});

app.get("/flowers", function(req, res){
    pool.query("select * FROM plant ORDER BY plant.name",  function(err, datum) {
      pool.query("select * FROM curuser",  function(err, data) {
      if(err) return console.log(err);
      res.render("flowers.hbs", {
        plant:datum, curuser:data
      });
    });
        
});
});


app.post("/flowers/:plantId", urlencodedParser, function (req, res) {
         
    if(!req.body) return res.sendStatus(400);
    const plantId = req.params.plantId;
    pool.query("select count(collectionId) + 1 AS ll from collection", function(err,datum){
      let collectionId = datum.ll;
      pool.query("select name, img from plant where (plantId = ?)",[plantId],function(err,datas){
        let name = datas[0].name;
        let img = datas[0].img;
        pool.query("select curUserId from curuser",function(err,datav){
          let curUserId = datav[0].curUserId;
          pool.query("INSERT INTO collection (collectionId, plantId, curUserId, name, img) VALUES (?, ?, ?, ?, ?)", [collectionId, plantId, curUserId, name, img], function(err, data){
            if(err) return console.log(err);
            res.redirect("/flowers");
          });
      })
    });
  })
});

app.post("/flowers/delete/:plantId", urlencodedParser, function (req, res) {
         
    if(!req.body) return res.sendStatus(400);
    const plantId = req.params.plantId;
    pool.query("delete from collection where (plantId = ?)", [plantId], function(err,data){
      
      if(err) return console.log(err);
      res.redirect("/collection");
  })
});

app.get("/collection", function(req, res){
  pool.query("SELECT collectionId, plantId, name, img FROM collection, curuser where (collection.curUserId = curuser.curUserId)",function(err, datum){
      pool.query("select * FROM curuser",  function(err, data) {
      if(err) return console.log(err);
      res.render("collection.hbs", {
        collection:datum, curuser:data
      });
    });        
});
});

// получем id редактируемого пользователя, получаем его из бд и отправлям с формой редактирования
app.get("/edit/:usersId", function(req, res){
  let usersId = req.params.usersId;
  pool.query("SELECT * FROM users WHERE usersId=?", [usersId], function(err, data) {
    if(err) return console.log(err);
     res.render("edit.hbs", {
        users: data[0]
    });
  });
});

// получаем отредактированные данные и отправляем их в БД
app.post("/edit",  urlencodedParser, function (req, res) {
         
  if(!req.body) return res.sendStatus(400);
  let firstName = req.body.firstName;

  let secondName = req.body.secondName;
  let usersId = req.body.usersId;
   
  pool.execute("UPDATE users SET firstName=?, secondName=? WHERE usersId=?", [firstName, secondName, usersId], function(err, data){
    if(err) return console.log(err);
    res.redirect("/main");
  });
});
 
// получаем id удаляемого пользователя и удаляем его из бд
app.post("/delete/:usersId", function(req, res){
          
  const usersId = req.params.usersId;
  pool.query("DELETE FROM users WHERE usersId=?", [usersId], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/main");
  });
});


 
app.listen(3000, function(){
  console.log("Сервер ожидает подключения...");
});

