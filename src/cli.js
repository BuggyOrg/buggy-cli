#!/usr/bin/env node
/* global __dirname, process */

import program from 'commander'
import fs from 'fs'
import lib from '@buggyorg/component-library'
import {resolve} from '@buggyorg/resolve'
import {remodelPorts} from '@buggyorg/npg-port-remodeler'
import {normalize} from '@buggyorg/dupjoin'
import {applyTypings} from '@buggyorg/typify'
import graphlib from 'graphlib'
import * as gogen from '@buggyorg/gogen'
import {replaceGenerics} from '@buggyorg/dynatype-network-graph'
import {resolveLambdaTypes} from '@buggyorg/functional'

var server = ''
var defaultElastic = ' Defaults to BUGGY_COMPONENT_LIBRARY_HOST'

if (process.env.BUGGY_COMPONENT_LIBRARY_HOST) {
  server = process.env.BUGGY_COMPONENT_LIBRARY_HOST
  defaultElastic += '=' + server
} else {
  server = 'http://localhost:9200'
  defaultElastic += ' or if not set to http://localhost:9200'
}

program
  .version(JSON.parse(fs.readFileSync(__dirname + '/../package.json'))['version'])
  .option('-e, --elastic <host>', 'The elastic server to connect to.' + defaultElastic, String, server)
  .parse(process.argv)

program
  .command('resolve <json>')
  .option('-o, --output <outputFile>', 'The output filename to generate')
  .description('Compile a program description into a program using a specific language.')
  .action((json, options) => {
    var client = lib(program.elastic)
    resolve(graphlib.json.read(JSON.parse(fs.readFileSync(json, 'utf8'))), client.get)
    .then((res) => console.log(JSON.stringify(graphlib.json.write(res))))
    .catch((err) => console.error(err.stack))
  })


program
  .command('compile <json> <language>')
  .option('-o, --output <outputFile>', 'The output filename to generate')
  .description('Compile a program description into a program using a specific language.')
  .action((json, language, options) => {
    var client = lib(program.elastic)
    resolve(graphlib.json.read(JSON.parse(fs.readFileSync(json, 'utf8'))), client.get)
    .then((res) => normalize(res))
    .then((res) => applyTypings(res, {number: 'int64', bool: 'bool', string: 'string'}))
    .then((res) => resolveLambdaTypes(res))
    .then((res) => remodelPorts(res))
    .then((res) => replaceGenerics(res))
//    .then((res) => gogen.preprocess(res))
//    .then((res) => gogen.generateCode(res))
    .then((res) => console.log(JSON.stringify(graphlib.json.write(res), null, 2)))
//    .then((res) => console.log(res))
    .catch((err) => {
      console.error('error while transpiling')
      console.error(err.stack)
    })
  })

program
  .command('dup <json>')
  .option('-o, --output <outputFile>', 'The output filename to generate')
  .description('Compile a program description into a program using a specific language.')
  .action((json, language, options) => {
    var client = lib(program.elastic)
    resolve(graphlib.json.read(JSON.parse(fs.readFileSync(json, 'utf8'))), client.get)
    .then((res) => normalize(res))
    .then((res) => console.log(JSON.stringify(graphlib.json.write(res))))
    .catch((err) => console.error(err.stack))
  })

program
  .command('ng <json>')
  .option('-o, --output <outputFile>', 'The output filename to generate')
  .description('Compile a program description into a program using a specific language.')
  .action((json, language, options) => {
    var client = lib(program.elastic)
    resolve(graphlib.json.read(JSON.parse(fs.readFileSync(json, 'utf8'))), client.get)
    .then((res) => normalize(res))
    .then((res) => remodelPorts(res))
    .then((res) => console.log(JSON.stringify(graphlib.json.write(res))))
    .catch((err) => {
      console.error('error while transpiling')
      console.error(err.stack)
    })
  })

program.parse(process.argv)
