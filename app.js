require("dotenv").config()

var querystring = require("querystring");
var express = require("express"); // Express web server framework
var request = require("request"); // "Request" library

const TOKEN = process.env.KEY;
const openLDBWS = require('ldbws-json');
const operation = require('ldbws-json/LDBWSOperation');
const api = new openLDBWS(TOKEN);

const app = express();

app.get("/", function(req,res) {
	res.writeHead(200, {"Content-Type": "text/html"});
	res.end("<h1>Hello world</h1>");
});

app.get("/departures", function(req,res) {
	res.writeHead(200, {"Content-Type": "text/html"});
	const station = req.query.station;
	console.log(station);
	const options = {"crs": station}
	api.call(operation.GET_DEPARTURE_BOARD, options).then((board) =>{
		const r = board.GetStationBoardResult;
		const services = r.trainServices.service;
		//console.log(services);

		for (s of services) {
		res.write(`${s.std} ${s.destination.location.locationName} ${s.etd} ${s.platform}`);
			res.write("<br/>");
		};
		res.end("");
	});
});

port = process.env.PORT;
console.log("Listening on",port);
app.listen(port);
