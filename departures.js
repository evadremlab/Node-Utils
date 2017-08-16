#!/usr/bin/env node

'use strict';

require('request');
const request = require('request-promise');

const os = require('os');
const util = require('util');
const etree = require('elementtree');

const API_KEY = '8B3BB034-904A-4fb8-957F-CBB7590E3F23';
const noDepartureTimesFor = 'There are no scheduled departure times for %s.';
const noDepartureTimes = 'There are no scheduled departure times for that stop.';

const reRoad = new RegExp('Rd', 'i');
const reStreet = new RegExp('St', 'i');
const reAvenue = new RegExp('Ave', 'i');
const reAmpersand = new RegExp('&|&nbsp;');
const reCompassPoints = new RegExp(' - Northbound| - Southbound| - Eastbound| - Westbound', 'i');

function getUrl(stopCode){
  return util.format('http://services.my511.org/Transit2.0/GetNextDeparturesByStopCode.aspx?token=%s&stopCode=%s', API_KEY, stopCode);
}

function getStopName(xmldoc) {
  var stopName = '';
  var stops = xmldoc.findall('*//Stop');
  var stop = stops && stops.length ? stops[0] : null;

  if (stop) {
    var words = stop.attrib.name.split(' ').map(function(word) {
      if (reRoad.test(word)) {
        word = 'Rd.';
      } else if (reStreet.test(word)) {
        word = 'St.';
      } else if (reAvenue.test(word)) {
        word = 'Ave.';
      } else if (reAmpersand.test(word)) {
        word = 'and';
      }

      return word;
    });

    stopName = words.join(' ');
  }

  return stopName;
}

function getStopTimes(stop) {
  var times = [];

  stop.findall('*/DepartureTime').forEach(function(time) {
    times.push(time.text);
  });

  if (times.length) {
    if (times.length > 1) {
      times[times.length - 1] = util.format('and %d', times[times.length - 1]);
    }
  }

  return times;
}

function getNextDeparturesByStopCode(stopCode) {
  return request.get(getUrl(stopCode));
}

function parseResponse(response) {
  try {
    var departures = [];
    var xmldoc = etree.parse(response);
    var stopName = getStopName(xmldoc);

    var departure = {
      stopName: stopName
    };

    xmldoc.findall('*/Agency').forEach(function(agency) {
      var agencyName = agency.attrib.Name;
      var transitMode = agency.attrib.Mode === 'Rail' ? 'train' : 'bus';

      departure.agencyName = agencyName;
      departure.transitMode = transitMode;

      agency.findall('*/Route').forEach(function(route) {
        var routeName = route.attrib.Name;

        departure.routeName = routeName;

        if (agency.attrib.HasDirection === 'True') {
          route.findall('*/RouteDirection').forEach(function(routeDirection) {
            var routeDirectionName = routeDirection.attrib.Name.replace(reCompassPoints, '');

            departure.routeDirectionName = routeDirectionName;

            routeDirection.findall('*/Stop').forEach(function(stop) {
              var times = getStopTimes(stop);

              departure.times = times;

              if (times.length) {
                console.log(JSON.stringify(departure));
                departures.push(util.format('%s %s %s to %s in %s minutes.', agencyName, routeName, transitMode, routeDirectionName, times.join(', ')));
              }
            });
          });
        } else {
          departure.routeDirectionName = '';

          route.findall('*/Stop').forEach(function(stop) {
            var times = getStopTimes(stop);

            departure.times = times;

            if (times.length) {
              console.log(JSON.stringify(departure));
              departures.push(util.format('%s %s %s in %s minutes.', agencyName, routeName, transitMode, times.join(', ')));
            }
          });
        }
      });
    });

    if (departures.length) {
      console.log(util.format('Arriving at %s: %s', stopName, departures.join(' ')));
    } else if (stopName) {
      console.log(util.format(noDepartureTimesFor, stopName));
    } else {
      console.log(noDepartureTimes);
    }
  } catch (err) {
    console.log('error parsing xml: ' + err.message);
    console.log(noDepartureTimes);
  }
}

getNextDeparturesByStopCode("51673").then(parseResponse,
    (error) => {
      console.log(error);
      console.log(noDepartureTimes);
    }
);
