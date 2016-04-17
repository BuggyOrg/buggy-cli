#!/usr/bin/env node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _componentLibrary = require('@buggyorg/component-library');

var _componentLibrary2 = _interopRequireDefault(_componentLibrary);

var _resolve = require('@buggyorg/resolve');

var _npgPortRemodeler = require('@buggyorg/npg-port-remodeler');

var _dupjoin = require('@buggyorg/dupjoin');

var _typify = require('@buggyorg/typify');

var _graphlib = require('graphlib');

var _graphlib2 = _interopRequireDefault(_graphlib);

var _gogen = require('@buggyorg/gogen');

var gogen = _interopRequireWildcard(_gogen);

var _dynatypeNetworkGraph = require('@buggyorg/dynatype-network-graph');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global __dirname, process */

var server = '';
var defaultElastic = ' Defaults to BUGGY_COMPONENT_LIBRARY_HOST';

if (process.env.BUGGY_COMPONENT_LIBRARY_HOST) {
  server = process.env.BUGGY_COMPONENT_LIBRARY_HOST;
  defaultElastic += '=' + server;
} else {
  server = 'http://localhost:9200';
  defaultElastic += ' or if not set to http://localhost:9200';
}

_commander2.default.version(JSON.parse(_fs2.default.readFileSync(__dirname + '/../package.json'))['version']).option('-e, --elastic <host>', 'The elastic server to connect to.' + defaultElastic, String, server).parse(process.argv);

_commander2.default.command('resolve <json>').option('-o, --output <outputFile>', 'The output filename to generate').description('Compile a program description into a program using a specific language.').action(function (json, options) {
  var client = (0, _componentLibrary2.default)(_commander2.default.elastic);
  (0, _resolve.resolve)(_graphlib2.default.json.read(JSON.parse(_fs2.default.readFileSync(json, 'utf8'))), client.get).then(function (res) {
    return console.log(JSON.stringify(_graphlib2.default.json.write(res)));
  }).catch(function (err) {
    return console.error(err.stack);
  });
});

_commander2.default.command('compile <json> <language>').option('-o, --output <outputFile>', 'The output filename to generate').description('Compile a program description into a program using a specific language.').action(function (json, language, options) {
  var client = (0, _componentLibrary2.default)(_commander2.default.elastic);
  (0, _resolve.resolve)(_graphlib2.default.json.read(JSON.parse(_fs2.default.readFileSync(json, 'utf8'))), client.get).then(function (res) {
    return (0, _dupjoin.normalize)(res);
  }).then(function (res) {
    return (0, _typify.applyTypings)(res, { number: 'int', bool: 'bool', string: 'string' });
  }).then(function (res) {
    return (0, _npgPortRemodeler.remodelPorts)(res);
  })
  //    .then((res) => replaceGenerics(res))
  //    .then((res) => gogen.preprocess(res))
  //    .then((res) => gogen.generateCode(res))
  .then(function (res) {
    return console.log(JSON.stringify(_graphlib2.default.json.write(res), null, 2));
  }).catch(function (err) {
    console.error('error while transpiling');
    console.error(err.stack);
  });
});

_commander2.default.command('dup <json>').option('-o, --output <outputFile>', 'The output filename to generate').description('Compile a program description into a program using a specific language.').action(function (json, language, options) {
  var client = (0, _componentLibrary2.default)(_commander2.default.elastic);
  (0, _resolve.resolve)(_graphlib2.default.json.read(JSON.parse(_fs2.default.readFileSync(json, 'utf8'))), client.get).then(function (res) {
    return (0, _dupjoin.normalize)(res);
  }).then(function (res) {
    return console.log(JSON.stringify(_graphlib2.default.json.write(res)));
  }).catch(function (err) {
    return console.error(err.stack);
  });
});

_commander2.default.command('ng <json>').option('-o, --output <outputFile>', 'The output filename to generate').description('Compile a program description into a program using a specific language.').action(function (json, language, options) {
  var client = (0, _componentLibrary2.default)(_commander2.default.elastic);
  (0, _resolve.resolve)(_graphlib2.default.json.read(JSON.parse(_fs2.default.readFileSync(json, 'utf8'))), client.get).then(function (res) {
    return (0, _dupjoin.normalize)(res);
  }).then(function (res) {
    return (0, _npgPortRemodeler.remodelPorts)(res);
  }).then(function (res) {
    return console.log(JSON.stringify(_graphlib2.default.json.write(res)));
  }).catch(function (err) {
    console.error('error while transpiling');
    console.error(err.stack);
  });
});

_commander2.default.parse(process.argv);