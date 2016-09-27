/* jshint node: true */
/* jshint esnext: true */
'use strict';

let PluginError = require('gulp-util').PluginError;
let through = require('through2');

// consts
let PLUGIN_NAME = 'gulp-json-values';

function getJsonValues(object, prefix, map) {
	let values = Object.keys(object).map(function(key) {
		let value = object[key];
		let path = prefix ? prefix + '.' + key : key;
		if (typeof value === 'string') {
			// String value
			map.set(path, value);
		} else if (value) {
			// Object
			getJsonValues(value, path, map);
		}
	});
}

function getJsonValuesFromFile(fileBuffer, encoding) {
	let fileContent = fileBuffer.contents.toString(encoding);
	let map = new Map();
	let object = JSON.parse(fileContent);
	getJsonValues(object, '', map);
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
			map = getJsonValuesFromFile(file, encoding);

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