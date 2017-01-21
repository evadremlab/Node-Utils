#!/usr/bin/env node

var prompt = require('prompt');

var randomChars = [];
var letters	= 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var numbers	= '12345678901234567890123456';
var specials = '!#$';

function getRandomInt() {
	var min = 1, max = 26;
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomChars(len) {
	for (var i=1; i<=len; i++) {
		var rnd = getRandomInt();
		if (rnd < 8) {
			randomChars.push(letters[rnd]);
		} else if (rnd < 16) {
			randomChars.push(letters[rnd].toLowerCase());
		} else if (rnd < 25) {
			randomChars.push(numbers[rnd]);
		} else {
			randomChars.push(specials[rnd]);
		}
	}
}

prompt.get(['length'], function (err, result) {
  if (err) { return onErr(err); }
	generateRandomChars(result.length);
	console.log(randomChars.join(''));
});

function onErr(err) {
  console.log(err);
  return 1;
}
