require("dotenv").config()

var querystring = require("querystring");
var express = require("express"); // Express web server framework
var request = require("request"); // "Request" library

const TOKEN = process.env.API_KEY;
const openLDBWS = require('ldbws-json');
const operation = require('ldbws-json/LDBWSOperation');
const api = new openLDBWS(TOKEN);

const app = express();

var Stomp = require('stomp-client');
var client = new Stomp('datafeeds.networkrail.co.uk', 61618, process.env.STOMP_USER, process.env.STOMP_PASS);


app.get("/", function(req,res) {
	res.writeHead(200, {"Content-Type": "text/html"});
	res.end("<h1>Go to /departures</h1>");
});

app.get('/style.css', function(req, res) {
  res.sendFile("style.css", { root: 'public' });
});

app.get("/depart/:crs?", function(req, res) {
	const crs = req.params.crs;
	if (crs) {
		res.sendFile("departures.html", { root: 'public' });
	} else {
		res.end("no station selected");
	}
});

app.get("/signals/:area?", function(req, res) {
	const area = req.params.area;
	if (area) {
		res.sendFile("signals.html", { root: 'public' });
	} else {
		res.end("no area selected");
	}
});

app.get("/signal_stream/:area", function(req,res) {
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
	});
	if (!req.params.area) {
		res.write("data: undefined&NO DATA\n\n");
		res.end();
		return;
	}
	var destination = `/topic/${req.params.area}` //'/topic/TD_WTV_SIG_AREA';	
	client.connect(function(sessionId) {
		client.subscribe(destination, function(body, headers) {
		  // process messages
		  for (msg of JSON.parse(body)) {
			  msg = msg[Object.keys(msg)[0]];
			  var time = new Date(msg.time*1000);
			  if (!((req.query.area_id)&&(req.query.area_id!=msg.area_id))) {
				  if ((msg.msg_type == "SF")&&(!(req.query.type)||(req.query.type==msg.msg_type))) {
					res.write(`data: ${req.params.area}&${time} ${msg.msg_type} ${msg.area_id} ${msg.address} ${msg.data}<br/>\n\n`);
				  } else if  ((msg.msg_type == "CA")&&(!(req.query.type)||(req.query.type==msg.msg_type))) {
					res.write(`data: ${req.params.area}&${time} ${msg.msg_type} ${msg.area_id} ${msg.descr} FROM ${msg.from} TO ${msg.to}<br/>\n\n`);
				  }
			  }
		  }
		});
	});
});

app.get("/departure_stream/:crs", function(req,res) {
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
	})
	const station = req.params.crs;
	if (station == null) {
		res.write("data: NO DATA&NO DATA\n\n");
		res.end();
		return
	}
	const n_services = req.query.top;
	depboard(res,station,n_services);
});

function depboard(res, station,n_services) {
	const options = {"crs": station}
	api.call(operation.GET_DEPARTURE_BOARD, options).then((board) =>{
		const r = board.GetStationBoardResult;
		var services = r.trainServices.service;
		const loc = r.locationName;
		if (n_services) {
			services = services.slice(0,n_services)
		}
		var b = `${loc}&`;
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
