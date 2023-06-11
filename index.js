//Imports required
const express = require("express");
const path = require("path");
const app = express();
const port = 8080;
const fs = require("fs");

//Implemented Queries to gather the data needed from the elastic search and more
const DAO = require("./models/DAO");
const getAllBooks = DAO.getAllBooks;
const searchBooks = DAO.searchBooks;
const getAllBooksByCategory = DAO.getAllBooksByCategory;
const checkUserAndBookReading = DAO.checkUserAndBookReading;
const decreaseBookReading = DAO.decreaseBookReading;
const addBookToReading = DAO.addBookToReading;
const getUserReadingBooks = DAO.getUserReadingBooks;
const updateUserSubscription = DAO.updateUserSubscription;
const countBooks = DAO.countBooks;
const indexBook = DAO.indexBook;
const getBookRecommendationsMLT = DAO.getBookRecommendationsMLT;
const getBookReviews = DAO.getBookReviews;
const indexReview = DAO.indexReview;
const getUser = DAO.getUser;

//Handle all the authentication proccesses using Auth0 API
const { auth } = require("express-openid-connect");
const { requiresAuth } = require("express-openid-connect");

//Auth0 API config
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: "bookiethebestwebapplicationever",
  baseURL: "http://localhost:8080",
  clientID: "uespzEOwKRaqVyVFPYa8pe3SAXEJCSpn",
  issuerBaseURL: "https://dev-dmbhuspe8z6q1fca.eu.auth0.com",
};

app.listen(port);

//app.use(express.static("public"));

// parse url-encoded content from body
app.use(express.urlencoded({ extended: false }));

// parse application/json content from body
app.use(express.json());

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

/*
STARTING PAGE FUNCTION
*/

// serve index.html as content root
app.get("/", function (req, res) {
  var options = {
    root: path.join(__dirname, "public"),
  };

  res.sendFile("index.html", options, function (err) {
    console.log(err);
  });
});

//Sends all books to the user when he is connecting to our site
app.post("/start", function (req, res) {
  console.log("start");

  getAllBooks().then((response) => {
    res.json({ quantity: response });
  });
});

app.get("/indexcss", function (req, res) {
  console.log("index css");
  var options = {
    root: path.join(__dirname, "public"),
  };

  res.sendFile("./css/index.css", options, function (err) {
    console.log(err);
  });
});

app.get("/indexjs", function (req, res) {
  console.log("index js");
  var options = {
    root: path.join(__dirname, "public"),
  };

  res.sendFile("./js/index.js", options, function (err) {
    console.log(err);
  });
});

/*
CATEGORY FUNCTION
*/

//Send category.html file
app.get("/category", function (req, res) {
  var options = {
    root: path.join(__dirname, "public"),
  };

  res.sendFile("category.html", options, function (err) {
    console.log(err);
  });
});

//Handle the response for a requested category
app.post("/categorybook", function (req, res) {
  console.log("category");
  getAllBooksByCategory().then((response) => {
    for (let i = 0; i < response.length; i++) {
      if (response[i].category == req.body.category) {
        res.json({ quantity: response[i].books });
        break;
      }
    }
  });
});

app.get("/categoryjs", function (req, res) {
  console.log("category js");
  var options = {
    root: path.join(__dirname, "public"),
  };

  res.sendFile("./js/category.js", options, function (err) {
    console.log(err);
  });
});

/*
  Search Function
*/
app.get("/search", function (req, res) {
  var options = {
    root: path.join(__dirname, "public"),
  };

  res.sendFile("search.html", options, function (err) {
    console.log(err);
  });
});

app.get("/searchjs", function (req, res) {
  console.log("search js");
  var options = {
    root: path.join(__dirname, "public"),
  };

  res.sendFile("./js/search.js", options, function (err) {
    console.log(err);
  });
});

//Handle the response for a given full-text search
app.post("/searchresult", function (req, res) {
  console.log("search");

  searchBooks(req.body.search).then((response) => {
    res.json({ quantity: response });
  });
});

app.get("/profile", requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

/*
  Read Book Function
*/
app.get("/read", requiresAuth(), function (req, res) {
  var options = {
    root: path.join(__dirname, "public"),
  };
  checkUserAndBookReading(req.oidc.user.email, req.query.catId).then(
    (response) => {
      if (response) {
        decreaseBookReading(req.oidc.user.email).then(() => {
          addBookToReading(req.query.catId, req.oidc.user.email).then(() => {
            res.sendFile("readBook.html", options, function (err) {
              console.log(err);
            });
          });
        });
      } else {
        res.sendFile("premium.html", options, function (err) {
          console.log(err);
        });
      }
    }
  );
});

app.get("/readcss", requiresAuth(), function (req, res) {
  console.log("read css");
  var options = {
    root: path.join(__dirname, "public"),
  };

  res.sendFile("./css/readBook.css", options, function (err) {
    console.log(err);
  });
});

app.get("/readjs", requiresAuth(), function (req, res) {
  console.log("read js");
  var options = {
    root: path.join(__dirname, "public"),
  };

  res.sendFile("./js/readBook.js", options, function (err) {
    console.log(err);
  });
});

//Retrive and send the requested to the user
app.post("/readbook", requiresAuth(), function (req, res) {
  var file = fs.createReadStream("./models/books/" + req.body.book + ".pdf");
  var stat = fs.statSync("./models/books/" + req.body.book + ".pdf");
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=quote.pdf");
  file.pipe(res);
});

//Retrive and send the requested to the user
app.post("/readaudiobook", requiresAuth(), function (req, res) {
  getUser(req.oidc.user.email).then((response) => {
    if (response.subscription) {
      try {
        if (fs.existsSync("./models/audioBooks/" + req.body.book + ".mp3")) {
          var file = fs.createReadStream(
            "./models/audioBooks/" + req.body.book + ".mp3"
          );
          var stat = fs.statSync(
            "./models/audioBooks/" + req.body.book + ".mp3"
          );
          res.setHeader("Content-Length", stat.size);
          res.setHeader("Content-Type", "audio/mpeg");
          res.setHeader(
            "Content-Disposition",
            "attachment; filename=quote.mp3"
          );
          file.pipe(res);
        }
      } catch (error) {
        console.log("ERROR READING FILE");
      }
    }
  });
});

app.get("/userreading", requiresAuth(), function (req, res) {
  console.log("user reading");
  var options = {
    root: path.join(__dirname, "public"),
  };

  res.sendFile("reading.html", options, function (err) {
    console.log(err);
  });
});

app.get("/userreadingjs", function (req, res) {
  console.log("reading js");
  var options = {
    root: path.join(__dirname, "public"),
  };

  res.sendFile("./js/reading.js", options, function (err) {
    console.log(err);
  });
});

app.post("/userreadingbooks", requiresAuth(), function (req, res) {
  getUserReadingBooks(req.oidc.user.email).then((response) => {
    res.json({ quantity: response });
  });
});

app.get("/picture", function (req, res) {
  var options = {
    root: path.join(__dirname, "public"),
  };

  let pic_id = req.query.query;

  res.sendFile("./Pictures/" + pic_id + ".png", options, function (err) {
    console.log(err);
  });
});

//Retrive and send the requested to the user
app.get("/pay", requiresAuth(), function (req, res) {
  console.log("pay");
  var options = {
    root: path.join(__dirname, "public"),
  };
  res.sendFile("pay.html", options, function (err) {
    console.log(err);
  });
});

//Retrive and send the requested to the user
app.get("/pay2", requiresAuth(), function (req, res) {
  console.log("pay2");
  userId = req.oidc.user.email;
  updateUserSubscription(userId).then(() => {
    res.redirect("http://localhost:8080");
  });
});

//Retrive and send the requested to the user
app.get("/upload", requiresAuth(), function (req, res) {
  console.log("upload");
  var options = {
    root: path.join(__dirname, "public"),
  };
  res.sendFile("upload.html", options, function (err) {
    console.log(err);
  });
});

app.get("/uploadjs", requiresAuth(), function (req, res) {
  console.log("upload js");
  var options = {
    root: path.join(__dirname, "public"),
  };
  res.sendFile("./js/upload.js", options, function (err) {
    console.log(err);
  });
});

app.get("/uploadcss", requiresAuth(), function (req, res) {
  console.log("upload css");
  var options = {
    root: path.join(__dirname, "public"),
  };
  res.sendFile("./css/upload.css", options, function (err) {
    console.log(err);
  });
});

app.post(
  "/uploadbookfile",
  express.raw({ type: "*/*", limit: "1gb" }),
  requiresAuth(),
  function (req, res) {
    console.log("BOOK FILE");
    countBooks()
      .then((response) => {
        let number = response + 1;
        fs.writeFileSync(
          __dirname + "/models/books/" + number + ".pdf",
          req.body
        );
        console.log("BOOK FILE NUMBER IS " + number);
      })
      .then(() => {
        res.status(200);
      });
  }
);

app.post(
  "/uploadbookcover",
  express.raw({ type: "*/*", limit: "1gb" }),
  requiresAuth(),
  function (req, res) {
    console.log("BOOK COVER");
    countBooks()
      .then((response) => {
        let number = response + 1;
        let fileName = __dirname + "/public/Pictures/" + number + ".png";
        fs.writeFileSync(fileName, req.body);
        console.log("BOOK COVER NUMBER IS " + number);
      })
      .then(() => {
        res.status(200);
      });
  }
);

app.post(
  "/uploadaudiobook",
  express.raw({ type: "*/*", limit: "1gb" }),
  requiresAuth(),
  function (req, res) {
    console.log("AUDIO BOOK");
    countBooks()
      .then((response) => {
        let number = response + 1;
        let fileName = __dirname + "/models/audioBooks/" + number + ".mp3";
        fs.writeFileSync(fileName, req.body);
        console.log("BOOK COVER NUMBER IS " + number);
      })
      .then(() => {
        res.status(200);
      });
  }
);

app.post("/uploadbookmetadata", requiresAuth(), function (req, res) {
  console.log("BOOK METADATA");
  console.log(req.body);
  indexBook(
    req.body.id,
    req.body.title,
    req.body.author,
    req.body.category,
    req.body.summary,
    req.body.size
  ).then(() => {
    res.status(200);
  });
});

app.get("/numBooks", function (req, res) {
  countBooks().then((response) => {
    res.send({ numbooks: response });
  });
});

app.post("/recommend", requiresAuth(), function (req, res) {
  getUserReadingBooks(req.oidc.user.email).then((response) => {
    getBookRecommendationsMLT(response).then((data) => {
      console.log(data);
      res.send({ quantity: data });
    });
  });
});

app.get("/recommendjs", requiresAuth(), function (req, res) {
  console.log("recommend js");
  var options = {
    root: path.join(__dirname, "public"),
  };
  res.sendFile("./js/recommendation.js", options, function (err) {
    console.log(err);
  });
});

app.post("/readreviews", requiresAuth(), function (req, res) {
  console.log("REVIES " + req.body.book);
  getBookReviews(req.body.book).then((response) => {
    res.send({ reviews: response });
  });
});

app.post("/savereviews", requiresAuth(), function (req, res) {
  indexReview(req.body.book, req.oidc.user.nickname, req.body.comment).then(
    (response) => {
      res.status(200).send("something");
    }
  );
});

app.get("/adsjs", requiresAuth(), function (req, res) {
  console.log("ads js");
  var options = {
    root: path.join(__dirname, "public"),
  };

  res.sendFile("./js/ads.js", options, function (err) {
    console.log(err);
  });
});

//Retrive and send the requested to the user
app.post("/ads", requiresAuth(), function (req, res) {
  getUser(req.oidc.user.email).then((response) => {
    if (response == undefined) {
      res.send({ premium: false });
    } else {
      if (response.subscription) {
        res.send({ premium: true });
      } else {
        res.send({ premium: false });
      }
    }
  });
});
