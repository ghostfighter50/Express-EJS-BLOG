var express = require('express');
var fs = require("fs")
var app = express();
var bodyParser = require('body-parser');
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use("/users", apiLimiter);
 
const createAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000	,
  max: 5, 
  message:
    "Too many accounts created from this IP, please try again after an hour"
});
const readJson = fs.readFileSync('./data/users.json');
var  data = JSON.parse(readJson);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/views'));
app.set('view engine', 'ejs');


app.get('/', function(req, res) {
	res.render('index');
});

app.get('/about', function(req, res) {
	res.render('about');
});
app.get('/contact', function(req, res) {
	res.render('contact');
});
app.get('/add', (req, res) => {
	res.render('add');
});
app.post('/add', createAccountLimiter , (req, res) => {
	const { title, classe } = req.body;

	data.push({ ID: data.length + 1, Title: title, Classe: classe });
	fs.writeFileSync('./data/users.json', JSON.stringify(data, null, 4));
	res.redirect('/users');
});
app.get('/users', (req, res) => {
	const { filter } = req.query;
	let filterData = [];

	if (filter) {
		for (let dt of data) {
			if (
				dt.Title === filter ||
				dt.Country === filter ||
				dt.ID === parseFloat(filter)
			) {
				filterData.push(dt);
			}
		}
	}

	else {
		filterData = data;
	}

	res.render('users', { data: filterData, filter });
});

app.get('/edit/:id', (req, res) => {
	const { id } = req.params;
	let dataId;

	for (let i = 0; i < data.length; i++) {
		if (Number(id) === data[i].ID) {
			dataId = i;
		}
		else{res.redirect('/')}
	}

	res.render('edit', { data: data[dataId] });
});

app.post('/edit/:id', (req, res) => {
	const { id } = req.params;
	const { title, Classe } = req.body;

	let dataId;
	for (let i = 0; i < data.length; i++) {
		if (Number(id) === data[i].ID) {
			dataId = i;
		}
	}

	data[dataId].Title = title;
	data[dataId].Classe = Classe;

	fs.writeFileSync('./data/users.json', JSON.stringify(data, null, 4));
	res.redirect('/users');
});
app.get('/delete/:id', (req, res) => {
	var { id } = req.params;

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

app.listen(process.env.PORT || 8080);
console.log('listening on port 8080');