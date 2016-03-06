#!/usr/bin/env node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _componentLibrary = require('@buggyorg/component-library');

var _componentLibrary2 = _interopRequireDefault(_componentLibrary);

var _resolve = require('@buggyorg/resolve');

var _graphlib = require('graphlib');

var _graphlib2 = _interopRequireDefault(_graphlib);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var server = '';
/* global __dirname, process */

var defaultElastic = ' Defaults to BUGGY_COMPONENT_LIBRARY_HOST';

if (process.env.BUGGY_COMPONENT_LIBRARY_HOST) {
  server = process.env.BUGGY_COMPONENT_LIBRARY_HOST;
  defaultElastic += '=' + server;
} else {
  server = 'http://localhost:9200';
  defaultElastic += ' or if not set to http://localhost:9200';
}

_commander2.default.version(JSON.parse(_fs2.default.readFileSync(__dirname + '/../package.json'))['version']).option('-e, --elastic <host>', 'The elastic server to connect to.' + defaultElastic, String, server).parse(process.argv);

_commander2.default.command('compile <json> <language>').option('-o, --output <outputFile>', 'The output filename to generate').description('Compile a program description into a program using a specific language.').action(function (json, language, options) {
  var client = (0, _componentLibrary2.default)(_commander2.default.host);
  (0, _resolve.resolve)(_graphlib2.default.json.read(JSON.parse(_fs2.default.readFileSync(json, 'utf8'))), client.get).then(function (res) {
    return console.log(JSON.stringify(res));
  }).catch(function (err) {
    return console.error(err.stack);
  });
});

_commander2.default.parse(process.argv);