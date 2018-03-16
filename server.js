var mongoose = require("mongoose");
var express = require("express");

// Use Express to initialize server
var app = express();
var PORT = process.env.PORT || 3000;

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Access static files
var path = require("path");
app.use("/static", express.static(path.join(__dirname, "/public")));

// Initialize Handlebars
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

var databaseUri = "mongodb://localhost/payment-gateway";
if (process.env.MONGODB_URI) {
	// Executes if this is being executed in Heroku
	mongoose.connect(process.env.MONGODB_URI, {});
} else {
	// Executes if this is being executed on local machine
	mongoose.connect(databaseUri, {});
}

var db = mongoose.connection;

// Show any Mongoose errors
db.on("error", function(err) {
	console.log("Mongoose Error: ", err);
});

// Once logged in to the database through Mongoose, log a success message
db.once("open", function() {
	console.log("Mongoose connection successful.");
});

// Import routes and allow server to access them
var routes = require("./controllers/routes");
app.use("/", routes);

app.listen(PORT, function() {
	console.log("App listening on PORT " + PORT);
});
