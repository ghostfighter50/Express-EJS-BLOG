/////////////////////////////////
//Importation des librairies////
///////////////////////////////
var express = require('express');
var session = require('express-session');
var fs = require("fs")
var app = express();
var bodyParser = require('body-parser');
var rateLimit = require("express-rate-limit");
var favicon = require('serve-favicon');
var morgan = require('morgan');
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


const readBlogJson = fs.readFileSync('./data/blog.json');
var blog = JSON.parse(readBlogJson);
const readJson = fs.readFileSync('./data/users.json');
var data = JSON.parse(readJson);


////////////////////////////////
//Definition des midlewares////
//////////////////////////////


app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(__dirname + '/views'));
app.use("/add", apiLimiter);
app.use(morgan('tiny'))
app.use(session({
    resave: true,
    saveUninitialized: true,
    cookie: {
        path: '/',
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000
    },
    secret: '1234567890QWERT'
}));
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
    if (ssn.loggedin == true) {
        res.redirect("/users")
    } else res.render('login', {
        fail: false
    });
});

app.post('/login', apiLimiter, (req, res) => {
    var {
        title,
        mdp
    } = req.body;
    ssn = req.session

    function creds() {
        for (var i = 0; i < data.length; i++) {
            if (data[i].mdp == mdp && data[i].Title === title) {
                console.log("Login found !");
                ssn.loggedin = true
                res.redirect('/users')
                return true
            }
            return false
        }
    }
    if (creds() == false) return res.render("login", {
        fail: true
    })
})

//add.ejs 

app.get('/add', (req, res) => {
    res.render('add');
});



///////////////////////////
//Creation d'utilisateurs//
///////////////////////////



app.post('/add', (req, res) => {
    const {
        title,
        classe,
        mdp
    } = req.body;
    ssn = req.session

    if (!ssn.loggedin) return res.redirect("/login")
    else {
        data.push({
            ID: data.length + 1,
            Title: title,
            Classe: classe,
            mdp: mdp
        });
        fs.writeFileSync('./data/users.json', JSON.stringify(data, null, 4));
        res.redirect('/users');
    }
});



//////////////////
//Panel Admin////
////////////////



app.get('/users', (req, res) => {
    ssn = req.session

    if (ssn.loggedin == true) {
        const {
            filter
        } = req.query;
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
        } else {
            //Selectionne toutes les donnees
            filterData = data;
        }

        res.render('users', {
            data: filterData,
            filter
        });
    } else {
        res.redirect('/login')
    }
});


/////////////////////////////////
//Modification d'utilisateurs///
///////////////////////////////


app.get('/edit/:id', (req, res) => {
    const {
        id
    } = req.params;
    let dataId;

    for (let i = 0; i < data.length; i++) {
        if (Number(id) === data[i].ID) {
            dataId = i;
        }
    }

    res.render('edit', {
        data: data[dataId]
    });
});


app.post('/edit/:id', (req, res) => {
    const {
        id
    } = req.params; //parametres de la requete
    const {
        title,
        Classe,
        mdp
    } = req.body;

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
    var {
        id
    } = req.params; //parametre de la requete

    const newData = [];
    for (let i = 0; i < data.length; i++) {
        if (Number(id) !== data[i].ID) {
            newData.push(data[i]);
        } else {
            res.redirect('/users')
        }

    }

    data = newData;
    fs.writeFileSync('./data/users.json', JSON.stringify(data, null, 4));
    res.redirect('/users');
});


//////////////////
//Deconnexion////
////////////////


app.get('/logout', (req, res) => {
    //supression du cookie
    req.session.destroy(function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});


///////////
//Blog////
/////////


app.get('/posts', (req, res) => {

    const {
        filter
    } = req.query;
    let filterData = [];
    //Parametre de recherche
    if (filter) {
        for (let dt of blog) {
            if (
                dt.Title === filter ||
                dt.Content === filter ||
                dt.ID === parseFloat(filter)
            ) {
                filterData.push(dt);
            }
        }
    } else {
        //Selectionne toutes les donnees
        filterData = blog;
    }
    res.render('posts', {
        blog: filterData,
        filter
    });

});

///////////////////////
//Creation de post////
/////////////////////

app.get('/create', (req, res) => {
    ssn = req.session
    if (!ssn.loggedin) return res.redirect("/login")

    res.render('create');
});



app.post('/create', (req, res) => {

    ssn = req.session
    if (!ssn.loggedin) return res.redirect("/login")

    else {
        blog.push({
            ID: blog.length + 1,
            Title: req.body.Title,
            Content: req.body.Content
        });
        fs.writeFileSync('./data/blog.json', JSON.stringify(blog, null, 4));
        res.redirect('/manage');
    }
});

///////////////////
//Voir un post////
/////////////////

app.get('/posts/:id', (req, res) => {
    const {
        id
    } = req.params;
    let dataId;

    for (let dt of blog) {
        if (
            dt.ID === parseFloat(id)
        ) {
            dataId = dt;
            res.render('post', {
                dt: dt
            });
        }
    }
});


//////////////////////
//Manager de Posts///
////////////////////


app.get('/manage', (req, res) => {
    ssn = req.session
    if (ssn.loggedin == true) {
        const {
            filter
        } = req.query;
        let filterData = [];
        //Parametre de recherche
        if (filter) {
            for (let dt of blog) {
                if (
                    dt.Title === filter ||
                    dt.Content === filter ||
                    dt.ID === parseFloat(filter)
                ) {
                    filterData.push(dt);
                }
            }
        } else {
            //Selectionne toutes les donnees
            filterData = blog;
        }

        res.render('manage', {
            blog: filterData,
            filter       });
    } else {
        res.redirect('/login')
    }
});



///////////////////////////
//Modification de posts////
/////////////////////////


app.get('/edit-post/:id', (req, res) => {
    const {
        id
    } = req.params;
    let dataId;

    for (let i = 0; i < blog.length; i++) {
        if (Number(id) === blog[i].ID) {
            dataId = i;
        }
    }

    res.render('edit-post', {
        blog: blog[dataId]
    });
});


app.post('/edit-post/:id', (req, res) => {
    const {
        id
    } = req.params; //parametres de la requete
    const {
        Title,
        Content,
        
    } = req.body;

    for (let i = 0; i < blog.length; i++) {
        if (Number(id) === blog[i].ID) {
			console.log(blog[i].Content)
			blog[i].Title = Title;
			blog[i].Content = Content;
        }
    }

   

    fs.writeFileSync('./data/blog.json', JSON.stringify(blog, null, 4));
    res.redirect('/manage');
});


///////////////////////////
//Suppression de posts////
/////////////////////////



app.get('/delete-post/:id', (req, res) => {
    var {
        id
    } = req.params; //parametre de la requete

    const newData = [];
    for (let i = 0; i < blog.length; i++) {
        if (Number(id) !== blog[i].ID) {
            newData.push(blog[i]);
        } else {
res.redirect("/manage")  
      }

    }

    blog = newData;
    fs.writeFileSync('./data/blog.json', JSON.stringify(blog, null, 4));
    res.redirect('/manage');
});



///////////////////////
//Page Introuvable////
/////////////////////



app.get('*', function(req, res) {
    res.render('404');
});



///////////////////////////
//Lancement du serveur////
/////////////////////////



app.listen(process.env.PORT || 8080);
console.log('listening on port 8080');