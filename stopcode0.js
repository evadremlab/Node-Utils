#!/usr/bin/env node

'use strict';

require('request');
const request = require('request-promise');

const os = require('os');
const util = require('util');
const etree = require('elementtree');

const API_KEY = '8B3BB034-904A-4fb8-957F-CBB7590E3F23';
const compassPoints = new RegExp('North|South|East|West', 'i');
const noDepartureTimes = 'Sorry, there are no scheduled departure times for that stop.';

function getUrl(stopCode){
  return util.format('http://services.my511.org/Transit2.0/GetNextDeparturesByStopCode.aspx?token=%s&stopCode=%s', API_KEY, stopCode);
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

getNextDeparturesByStopCode("40098").then(
    (response) => {
      try {
        var departures = [];

        etree.parse(response).findall('*/Agency').forEach(function(agency) {
          var agencyName = agency.attrib.Name;
          var transitMode = agency.attrib.Mode === 'Rail' ? 'train' : 'bus';

          agency.findall('*/Route').forEach(function(route) {
            var routeName = route.attrib.Name.;

            if (agency.attrib.HasDirection === 'True') {
              route.findall('*/RouteDirection').forEach(function(routeDirection) {
                routeDirection.findall('*/Stop').forEach(function(stop) {
                  var routeDirectionCode = '';
                  var routeDirectionDescription = '';
                  var stopName = stop.attrib.name.;
                  var times = getStopTimes(stop);

                  if (compassPoints.test(routeDirection.attrib.Code)) {
                    routeDirectionCode = util.format('%s ', routeDirection.attrib.Code);
                  }

                  routeDirectionDescription = util.format(' %sto %s', routeDirectionCode, routeDirection.attrib.Name.replace(' - ', ' '));

                  if (times.length) {
                    departures.push(util.format('%s %s %s%s arriving at %s in %s minutes.', agencyName, routeName, transitMode, routeDirectionDescription, stopName, times.join(', ')));
                  }
                });
              });
            } else {
              route.findall('*/Stop').forEach(function(stop) {
                var routeDirectionCode = '';
                var routeDirectionDescription = '';
                var stopName = stop.attrib.name;
                var times = getStopTimes(stop);

                if (times.length) {
                  departures.push(util.format('%s %s %s%s arriving at %s in %s minutes.', agencyName, routeName, transitMode, routeDirectionDescription, stopName, times.join(', ')));
                }
              });
            }
          });
        });

        console.log(departures.join(os.EOL));
      } catch (err) {
        console.log('error parsing xml: ' + err.message);
      }
    },
    (error) => {
      console.log(error);
    }
);
