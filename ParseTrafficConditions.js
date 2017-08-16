#!/usr/bin/env node

/* jshint node: true */
/* jshint esversion: 6 */

'use strict';

var https = require('https');
var util = require('util');

// add timestamps in front of log messages
require( 'console-stamp')( console, { pattern : 'HH:MM:ss.l' } );

var STATUS_OK = 'OK';
var STATUS_ERROR = 'ERROR';
var API_KEY = '382724498129';

function getUrl(poi){
  return util.format('https://vxml-dev01.dev.iterismtc.com/mtcTrafficApi/getTrafficCondtionsByPoiName?token=%s&poi_name=%s', API_KEY, poi);
}

function getDataFromAPI(stopCode, callback){
  var body = '';
  var url = getUrl(stopCode);

  console.log('fetch data');

  https.get(url, function(res) {
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

function parseTrafficConditions(data) {
  var jsonData = JSON.parse(data);
  var reAudio = new RegExp('\<audio src\="(.*)\.wav"\>', 'g');

  console.log('start parsing');

  jsonData.forEach(function(obj) {
    var parts = [];
    var ssml = obj['slowdown_ssml'];
    var audios = ssml.replace('<prompt xml:lang="en-US">', '').replace('</prompt>', '').split('</audio>');

    audios.forEach(function(item) {
      parts.push(item.replace(reAudio, '').trim());
    });

    console.log(util.format('link: %s, ssml: %s\n', obj['link_id'], parts.join(' ')));
  });
}

var poi = 'US-101';

getDataFromAPI(poi, function(statusCode, response){
  if (statusCode === STATUS_ERROR) {
    console.log(util.format('Sorry, we encountered an error getting traffic conditions for %s: %s', poi, response));
  } else {
    parseTrafficConditions(response)
  }
  console.log('done');
});
