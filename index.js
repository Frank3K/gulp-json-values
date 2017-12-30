/* jshint node: true */
/* jshint esnext: true */
'use strict';

let PluginError = require('plugin-error');
let through = require('through2');
let cheerio = require('cheerio');

// consts
let PLUGIN_NAME = 'gulp-json-values';

function getJsonValues(object, prefix, map, stripHtml) {
	let values = Object.keys(object).map(function(key) {
		let value = object[key];
		let path = prefix ? prefix + '.' + key : key;
		if (typeof value === 'string') {
			if (stripHtml) {
				let html = cheerio('<div>' + value + '</div>');
				value = html.text();
			}

			// String value
			map.set(path, value);
		} else if (value) {
			// Object
			getJsonValues(value, path, map, stripHtml);
		}
	});
}

function getJsonValuesFromFile(fileBuffer, encoding, stripHtml) {
	let fileContent = fileBuffer.contents.toString(encoding);
	let map = new Map();
	let object = JSON.parse(fileContent);
	getJsonValues(object, '', map, stripHtml);
	return map;
}

function stringifyMapValues(map) {
	return new Buffer(Array.from(map, x => x[1]).join('\n'));
}

module.exports = function() {
	var map = new Map();

	function bufferContents(file, encoding, callback) {
		if (file.isNull()) {
			// nothing to do
			return callback(null, file);
		}

		/* jshint validthis: true */
		if (file.isStream()) {
			this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
		} else if (file.isBuffer()) {
			// Get key value map
			map = getJsonValuesFromFile(file, encoding, true);

			// Write contents
			file.contents = stringifyMapValues(map);

			// Append txt extension
			file.path += '.txt';

			this.push(file);

			return callback(null, file);
		}
	}

	return through.obj(bufferContents);
};
