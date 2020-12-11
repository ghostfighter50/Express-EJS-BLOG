/////////////////////////////////
//Importation des librairies////
///////////////////////////////


var express = require('express');
var session = require('express-session'); 
var fs = require("fs")
var app = express();
var bodyParser = require('body-parser');
var rateLimit = require("express-rate-limit");
var ssn


 //////////////////////////////
//Limite de requete par IP////
/////////////////////////////



const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5
  });



 /////////////////////////
//Lecture des donnees////
////////////////////////



const readJson = fs.readFileSync('./data/users.json');
var  data = JSON.parse(readJson);


////////////////////////////////
//Definition des midlewares////
//////////////////////////////



app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/views'));
app.use("/add", apiLimiter);
app.use(session({resave : true, saveUninitialized : true, cookie: { path : '/', httpOnly: false, maxAge  : 24*60*60*1000}, secret: '1234567890QWERT'  }));
app.set('view engine', 'ejs');



/////////////
//Routes////
///////////



//index.ejs 

app.get('/', function(req, res) {
	res.render('index');
});

//about.ejs 

app.get('/about', function(req, res) {
	res.render('about');
});

//login.ejs 

app.get('/login', function(req, res) {
	ssn = req.session

	if(ssn.loggedin == true){res.redirect("/users")}

    else	res.render('login');
});

app.post('/login', (req, res) => {
	var { title, mdp } = req.body;
	ssn = req.session
	for(var i=0;i<data.length;i++){
		if(data[i].mdp== mdp && data[i].Title === title ){
		   console.log("Login found !");

		   ssn.loggedin = true
		   res.redirect('/users')
		   return true;
		}
	 }
})

//add.ejs 

app.get('/add', (req, res) => {
	res.render('add');
});



///////////////////////////
//Creation d'utilisateurs//
///////////////////////////



app.post('/add' , (req, res) => {
	const { title, classe, mdp } = req.body;

	data.push({ ID: data.length + 1, Title: title, Classe: classe, mdp : mdp });
	fs.writeFileSync('./data/users.json', JSON.stringify(data, null, 4));
	res.redirect('/users');
});



//////////////////
//Panel Admin////
////////////////



app.get('/users', (req, res) => {
	ssn = req.session

	if(ssn.loggedin == true){
	const { filter } = req.query;
	let filterData = [];
//Parametre de recherche
	if (filter) {
		for (let dt of data) {
			if (
				dt.Title === filter ||
				dt.Classe === filter ||
				dt.mdp === filter ||
				dt.ID === parseFloat(filter)
			) {
				filterData.push(dt);
			}
		}
	}

	else {
		//Selectionne toutes les donnees
		filterData = data;
	}

	res.render('users', { data: filterData, filter });
}
else{
	res.redirect('/login')
}
});

//edit.ejs/:id

app.get('/edit/:id', (req, res) => {
	const { id } = req.params;
	let dataId;

	for (let i = 0; i < data.length; i++) {
		if (Number(id) === data[i].ID) {
			dataId = i;
		}
		else{res.redirect('/users')}
	}

	res.render('edit', { data: data[dataId] });
});



/////////////////////////////////
//Modification d'utilisateurs///
///////////////////////////////



app.post('/edit/:id', (req, res) => {
	const { id } = req.params; //parametres de la requete
	const { title, Classe, mdp } = req.body; 

	let dataId;
	for (let i = 0; i < data.length; i++) {
		if (Number(id) === data[i].ID) {
			dataId = i;
		}
	}

	data[dataId].Title = title;
	data[dataId].Classe = Classe;
	data[dataId].mdp = mdp;

	fs.writeFileSync('./data/users.json', JSON.stringify(data, null, 4));
	res.redirect('/users');
});

/////////////////////////////////
//Suppression d'utilisateurs////
///////////////////////////////

app.get('/delete/:id', (req, res) => {
	var { id } = req.params; //parametre de la requete

	const newData = [];
	for (let i = 0; i < data.length; i++) {
		if (Number(id) !== data[i].ID) {
			newData.push(data[i]);
		}	else{res.redirect('/users')}

	}

	data = newData;
	fs.writeFileSync('./data/users.json', JSON.stringify(data, null, 4));
	res.redirect('/users');
});

app.get('/logout',function(req,res){
	req.session.destroy(function(err) {
	  if(err) {
		console.log(err);
	  } else {
		res.redirect('/');
	  }
	});
  });
///////////////////////////
//Lancement du serveur////
/////////////////////////

app.listen(process.env.PORT || 8080);
console.log('listening on port 8080');