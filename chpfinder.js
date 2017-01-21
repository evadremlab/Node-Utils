/*
Search for a single LogID in CHP DataFeedReports downloaded from server.
usage: "node chpfinder.js"
*/

var fs = require('fs');
var util = require('util');
var readline = require('readline');

var maxFiles;
var fileCount = 0;
var searchResults = {};
var searchString = '161104GG01891';
var testFolder = '../Downloads/DataFeedReportsPROD/';
var columnLimit = 3; // so we don't capture all data fields
var tdTag = /\<td\>|\<\/td>/gi;

function stripTags(s) {
	return s.replace(tdTag, '');
}

fs.readdir(testFolder, (err, files) => {
  files.forEach(file => {
		var results = [];
		var columnCount = 0;
		var hasSearchString = false;

		var _reset = function() {
			columnCount = 0;
			hasSearchString = false;
		};

		var _saveResult = function(value) {
			var newValue = stripTags(value);

			var _exists = function(existingValue) {
				return existingValue === newValue;
			};
			if (!results.find(_exists)) {
				results.push(newValue);
			}
		};

		var rd = readline.createInterface({
		  input: fs.createReadStream(testFolder + file),
		  output: process.stdout,
		  terminal: false
		});

		rd.on('line', function(line) {
			line = line.trim();
			if (line.startsWith('<tr>') || line.startsWith('</tr>')) {
				_reset();
			} else if (line.startsWith('<td>')) {
				if (hasSearchString) {
					if (++columnCount <= columnLimit) {
						_saveResult(line);
					}
				} else if (line.indexOf(searchString) > -1) {
					hasSearchString = true;
					_saveResult(line);
				}
			}
		});

		rd.on('close', function() {
			if (results.length) {
				searchResults[file] = results.join(',');
			}
			if (++fileCount === files.length) {
				// we're done, sort results by filename
				var keys = Object.keys(searchResults);
				keys.sort().forEach(function(key) {
  				console.log(util.format('%s : %s', key, searchResults[key]));
				});
			}
		});
  });
})
