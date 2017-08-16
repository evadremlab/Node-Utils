'use strict';

var http = require('http');
var util = require('util');
var xml2jsParser = require('xml2js-parser');

var STATUS_OK = 'OK';
var STATUS_ERROR = 'ERROR';
var API_KEY = '8B3BB034-904A-4fb8-957F-CBB7590E3F23';

var compassPoints = new RegExp('North|South|East|West', 'i');
var noDepartureTimes = 'Sorry, there are no scheduled departure times for that stop.';

var departureTimes = [];

function getUrl(stopCode){
  return util.format('http://services.my511.org/Transit2.0/GetNextDeparturesByStopCode.aspx?token=%s&stopCode=%s', API_KEY, stopCode);
}

function getDataFromAPI(stopCode, callback){
  var url = getUrl(stopCode);

  http.get(url, function(res) {
    var body = '';

    if (res.statusCode === 200) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        body += chunk;
      });
      res.on('end', function() {
        callback(STATUS_OK, body);
      });
    } else {
      callback(STATUS_ERROR, util.format('Error on %s: %s %s', url, res.statusCode, http.STATUS_CODES[res.statusCode]));
    }
  }).on('error', function(err) {
    callback(STATUS_ERROR, err.message);
  });
}

function parseStopList(agency, route, stopList, routeDirection) {
  // only BUS mode has routeDirection
  var routeDirectionCode = '';
  var routeDirectionDescription = '';

  if (routeDirection) {
    if (compassPoints.test(routeDirection.$.Code)) {
      routeDirectionCode = util.format('%s ', routeDirection.$.Code);
    }
    routeDirectionDescription = util.format(' %sto %s', routeDirectionCode, routeDirection.$.Name.replace(' - ', ' '));
  }

  stopList.Stop.forEach(function(stop) {
    stop.DepartureTimeList.forEach(function(departureTimeList) {
      var times = [];
      if (departureTimeList.DepartureTime) {
        departureTimeList.DepartureTime.forEach(function(departureTime) {
          times.push(departureTime);
        });
        if (times.length) {
          if (times.length > 1) {
            times[times.length - 1] = util.format('and %d', times[times.length - 1]);
          }
          var transitMode = agency.$.Mode === 'Rail' ? 'train' : 'bus';
          departureTimes.push(util.format('%s %s %s%s arriving at %s in %s minutes.', agency.$.Name, route.$.Name, transitMode, routeDirectionDescription, stop.$.name, times.join(', ')));
        }
      }
    });
  });
}

function parseBUS(agency) {
  // BUS mode has Agency.RouteList.Route.RouteDirectionList.RouteDirection.StopList
  agency.RouteList.forEach(function(routeList) {
    routeList.Route.forEach(function(route) {
      route.RouteDirectionList.forEach(function(routeDirectionList) {
        routeDirectionList.RouteDirection.forEach(function(routeDirection) {
          routeDirection.StopList.forEach(function(stopList) {
            parseStopList(agency, route, stopList, routeDirection);
          });
        });
      });
    });
  });
}

function parseBART(agency) {
  // BART mode has Agency.RouteList.Route.StopList
  agency.RouteList.forEach(function(routeList) {
    routeList.Route.forEach(function(route) {
      route.StopList.forEach(function(stopList) {
        parseStopList(agency, route, stopList);
      });
    });
  });
}

function parseDeparturesByStopCode(xml) {
  var jsonData = xml2jsParser.parseStringSync(xml);

  jsonData.RTT.AgencyList.forEach(function(agencyList) {
    if (agencyList.Agency) {
      agencyList.Agency.forEach(function(agency) {
        if (agency.$.Mode === 'Bus') {
          parseBUS(agency);
        } else {
          parseBART(agency);
        }
      });
    }
  });

  if (departureTimes.length) {
    return departureTimes.join(' ');
  } else {
    return noDepartureTimes;
  }
}

module.exports = {
  getNextDeparturesByStopCode: function(stopCode){
    return new Promise(function(resolve, reject){
      getDataFromAPI(stopCode, function(statusCode, response){
        if (statusCode === STATUS_ERROR) {
          reject(util.format('Sorry, we encountered an error getting real-time departures for stop %s: %s', stopCode, response));
        } else {
          resolve(parseDeparturesByStopCode(response));
        }
      });
    });
  }
};
