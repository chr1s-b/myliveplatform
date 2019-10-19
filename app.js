require("dotenv").config()

var querystring = require("querystring");
var express = require("express"); // Express web server framework
var request = require("request"); // "Request" library

const TOKEN = process.env.API_KEY;
const openLDBWS = require('ldbws-json');
const operation = require('ldbws-json/LDBWSOperation');
const api = new openLDBWS(TOKEN);

const app = express();
app.use(express.static('public'))

app.get("/", function(req,res) {
	res.writeHead(200, {"Content-Type": "text/html"});
	res.end("<h1>Go to /departures</h1>");
});

app.get("/departure_stream", function(req,res) {
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
	})
	const station = req.query.station;
	if (station == null) {
		res.write("data: no station specified\n\n");
		res.end();
		return
	}
	const n_services = req.query.top;
	console.log(station);
	depboard(res,station,n_services);
});

function depboard(res, station,n_services) {
	const options = {"crs": station}
	api.call(operation.GET_DEPARTURE_BOARD, options).then((board) =>{
		const r = board.GetStationBoardResult;
		const services = r.trainServices.service;
		const loc = r.locationName;
		if (n_services != null) {
			services = services.slice(0,n_services)
		}
		console.log(r);
		var b = `${loc}&<br/>`;
		for (s of services) {
			b = b + `${s.std} ${s.destination.location.locationName} ${s.etd} ${s.platform} <br/>`;
		};
		res.write("data: "+b+"\n\n");
		setTimeout(() => depboard(res, station,n_services), 10*1000);
	});
}

port = process.env.PORT;
console.log("Listening on",port);
app.listen(port);
