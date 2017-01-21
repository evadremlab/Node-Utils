#!/usr/bin/env node

const http = require('http');
const util = require('util');
const os = require('os');
const parseStringSync = require('xml2js-parser').parseStringSync;

const STATUS_OK = 'OK';
const STATUS_ERROR = 'ERROR';
const API_KEY = '8B3BB034-904A-4fb8-957F-CBB7590E3F23';

var url = function(stopCode){
  return 'http://services.my511.org/Transit2.0/GetNextDeparturesByStopCode.aspx?token=' + API_KEY + '&stopCode=' + stopCode;
};

var getDataFrom511 = function(stopCode, callback){
  http.get(url(stopCode), function(response){
    var body = '';

    response.on('data', function(data){ // continuously update stream with data
      body += data;
    });

    response.on('end', function(){ // all data received
      callback(STATUS_OK, body);
    });

  }).on('error', function(err){
		callback(STATUS_ERROR, err.message);
  });
};

var parseDeparturesByStopCode = function(xml) {
  var results = [];
  var jsonData = parseStringSync(xml);

  jsonData.RTT.AgencyList.forEach(function(a) {
    a.Agency.forEach(function(agency) {
      agency.RouteList.forEach(function(routeList) {
        routeList.Route.forEach(function(route) {
          route.StopList.forEach(function(e) {
            e.Stop.forEach(function(stop) {
              stop.DepartureTimeList.forEach(function(departureTimeList) {
                var departureTimes = [];
                if (departureTimeList.DepartureTime) {
                  departureTimeList.DepartureTime.forEach(function(departureTime) {
                    departureTimes.push(departureTime);
                  });
                  if (departureTimes.length) {
                    if (departureTimes.length > 1) {
                      departureTimes[departureTimes.length - 1] = util.format('and %d', departureTimes[departureTimes.length - 1]);
                    }
                    results.push(util.format('%s %s arriving at %s in %s minutes', route.$.Name, agency.$.Name, stop.$.name, departureTimes.join(', ')));
                  } else {
                    results.push(util.format('No scheduled departures for %s %s at %s', route.$.Name, agency.$.Name, stop.$.name));
                  }
                } else {
                  results.push(util.format('No scheduled departures for %s %s at %s', route.$.Name, agency.$.Name, stop.$.name));
                }
              });
            });
          });
        });
      });
    });
  });

  return results.join(os.EOL);
};

// MAIN

getDataFrom511("68", function(statusCode, data){
	if (statusCode === STATUS_ERROR) {
		console.log(util.format('Real-time departures for stop %s, ERROR: %s', intent.slots.stop.value, data));
	} else {
		console.log(parseDeparturesByStopCode(data));
	}
});
