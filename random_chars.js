#!/usr/bin/env node

var prompt = require('prompt');

var randomChars = [];
var letters	= 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var numbers	= '12345678901234567890123456';
var specials = '!#$';

function getRandomInt(max) {
	var min = 1;
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomChars(len) {
	for (var i=1; i<=len; i++) {
		var index = getRandomInt(letters.length);
		var specialIndex = getRandomInt(specials.length);
		if (index < 8) {
			randomChars.push(letters[index]);
		} else if (index < 16) {
			randomChars.push(letters[index].toLowerCase());
		} else if (index < 25) {
			randomChars.push(numbers[index]);
		} else {
			randomChars.push(specials[specialIndex]);
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
