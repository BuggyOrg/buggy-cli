#!/usr/bin/env node
/* global __dirname, process */

import program from 'commander'
import fs from 'fs'
import lib from '@buggyorg/component-library'
import {resolve} from '@buggyorg/resolve'
import {remodelPorts} from '@buggyorg/npg-port-remodeler'
import decompoundify from '@buggyorg/decompoundify'
import {normalize} from '@buggyorg/dupjoin'
import {applyTypings} from '@buggyorg/typify'
import {convertGraph} from '@buggyorg/graphlib2kgraph'
import addContinuations from '@buggyorg/muxcontinuations'
import {parse_to_json} from '@buggyorg/lisgy'
import {optimize} from '@buggyorg/nitro'
// import kgraph2Svg from '@buggyorg/graphify'
import {graphToWebsite} from '@buggyorg/graphify'
import {check} from '@buggyorg/checker'
import graphlib from 'graphlib'
import gogen from '@buggyorg/gogen'
import {replaceGenerics, isGenericFree, genericNodes} from '@buggyorg/generics'
import {resolveLambdaTypes} from '@buggyorg/functional'
import promisedExec from 'promised-exec'
import tempfile from 'tempfile'
import path from 'path'
import open from 'open'
import getStdin from 'get-stdin'

var server = ''
var defaultElastic = ' Defaults to BUGGY_COMPONENT_LIBRARY_HOST'

if (process.env.BUGGY_COMPONENT_LIBRARY_HOST) {
  server = process.env.BUGGY_COMPONENT_LIBRARY_HOST
  defaultElastic += '=' + server
} else {
  server = 'http://localhost:9200'
  defaultElastic += ' or if not set to http://localhost:9200'
}

const getInputJSON = (file) => {
  var resPromise
  if (file) {
    resPromise = Promise.resolve(fs.readFileSync(file, 'utf8'))
    if (path.extname(file) === '.clj') {
      resPromise = resPromise
        .then((res) => parse_to_json(res, true))
    } else {
      resPromise = resPromise.then((res) => JSON.parse(res))
    }
  } else {
    resPromise = getStdin()
      .then((res) => {
        try {
          return JSON.parse(res)
        } catch (e) {
          // doesn't seem to be a valid graph, assume lisgy
          return parse_to_json(res, true)
        }
      })
  }
  return resPromise
}

const getInputGraph = (file) => {
  return getInputJSON(file)
  .then((res) => graphlib.json.read(res))
}

program
  .version(JSON.parse(fs.readFileSync(path.join(__dirname, '/../package.json')))['version'])
  .option('-e, --elastic <host>', 'The elastic server to connect to.' + defaultElastic, String, server)
  .parse(process.argv)

program
  .command('json [json]')
  .option('-o, --output <outputFile>', 'The output filename to generate')
  .description('Compile a program description into a program using a specific language.')
  .action((json, options) => {
    getInputJSON(json)
    .then((res) => console.log(JSON.stringify(res)))
    .catch((err) => console.error(err.stack))
  })

program
  .command('resolve [json]')
  .option('-o, --output <outputFile>', 'The output filename to generate')
  .description('Compile a program description into a program using a specific language.')
  .action((json, options) => {
    var client = lib(program.elastic)
    getInputGraph(json)
    .then((res) => resolve(res, client.get))
    .then((res) => console.log(JSON.stringify(graphlib.json.write(res))))
    .catch((err) => console.error(err.stack))
  })

program
  .command('svg [json]')
  .option('-b, --bare', 'Do not resolve the graph file')
  .description('Create a SVG flow chart diagram for the given json file.')
  .action((json, options) => {
    var client = lib(program.elastic)
    var resPromise = getInputGraph(json)
    if (options.bare) {
      resPromise = Promise.resolve(graphlib.json.read(JSON.parse(fs.readFileSync(json, 'utf8'))))
    } else {
      resPromise = resolve(graphlib.json.read(JSON.parse(fs.readFileSync(json, 'utf8'))), client.get)
    }
    resPromise
    .then((res) => check(res))
    .then((res) => convertGraph(res))
    .then((res) => {
      var f = tempfile('.json')
      fs.writeFileSync(f, JSON.stringify(res))
      // sadly the API call didn't work. Start the CLI variant
      return promisedExec('node ' + path.join(__dirname, '../node_modules/@buggyorg/graphify/lib/cli.js') + ' -f "' + f + '"')
        // .then(() => { fs.unlinkSync(f) })
    })
    // .then((res) => kgraph2Svg(res))
    .then((res) => console.log(res))
    .catch((err) => console.error(err.stack))
  })

program
  .command('interactive [json]')
  .option('-b, --bare', 'Do not resolve the graph file')
  .option('-t, --types', 'Resolve types in graph')
  .option('-d, --decompoundify', 'Remove all unnecessary compounds')
  .option('-s, --steps <n>', 'Maximum number of steps for resolving generics (only works with t). [debug mode]')
  .option('-c, --cancle', 'Cancle before starting browser session. [debug mode]')
  .option('-n, --norm', 'Transform the graph into the normalized form.')
  .option('-o, --optimize', 'Optimize the program graph.')
  .option('-m, --mux', 'Calculate mux continuations. Only when `--types` is enabled')
  .description('Opens a browser window with an interactive version of the layouted graph')
  .action((json, options) => {
    var client = lib(program.elastic)
    var resPromise = getInputGraph(json)
    if (!options.bare) {
      resPromise = resPromise.then((res) => resolve(res, client.get))
    }
    if (options.types) {
      resPromise = resPromise
      .then((res) => applyTypings(res, {number: 'int64', bool: 'bool', string: 'string'}))
      .then((res) => resolveLambdaTypes(res))
      .then((res) => replaceGenerics(res, options.steps))
      .then((res) => {
        if (!isGenericFree(res)) {
          console.error('Unable to resolve all generic types. Remaining nodes with generics:' + genericNodes(res))
        }
        return res
      })
      if (options.decompoundify) {
        resPromise = resPromise.then((res) => decompoundify(res))
      }
      if (options.mux) {
        // resPromise = resPromise.then((res) => { console.error(JSON.stringify(graphlib.json.write(res))); return res })
        resPromise = resPromise.then((res) => addContinuations(res))
      }
      if (options.optimize) {
        resPromise = resPromise.then((res) => { optimize(res); return res })
      }
    } else if (options.decompoundify) {
      resPromise = resPromise.then((res) => decompoundify(res))
    }
    if (options.norm) {
      resPromise = resPromise.then((res) => normalize(res, {createDuplicatesAndJoins: true}))
    }
    if (options.cancle) {
      resPromise = resPromise.then(() => process.exit(1))
    }
    resPromise
    .then((res) => convertGraph(res))
    .then((graph) => graphToWebsite(graph))
    .then((html) => {
      const tmpFile = tempfile('.html')
      fs.writeFileSync(tmpFile, html)
      open(tmpFile)
    })
    .catch((err) => console.error(err.stack))
  })

program
  .command('compile [input] <language>')
  .option('-o, --output <outputFile>', 'The output filename to generate')
  .option('-b, --bare', 'Do not resolve the json file.')
  .option('-s, --sequential', 'Generate sequential code')
  .option('-o, --optimize', 'Optimize program before generating code')
  .option('-c, --countOperations', 'Count the number of performed operations during execution.')
  .description('Compile a program description into a program using a specific language.')
  .action((json, language, options) => {
    var client = lib(program.elastic)
    const genCode = (options.sequential) ? gogen.generateSequentialCode : gogen.generateCode
    var resPromise = getInputGraph(json)
    if (!options.bare) {
      resPromise = resPromise.then((res) => resolve(res, client.get))
    }
    resPromise = resPromise
    .then((res) => check(res))
    .then((res) => resolveLambdaTypes(res))
    .then((res) => replaceGenerics(res))
    .then((res) => {
      if (!isGenericFree(res)) {
        throw new Error('Unable to resolve all generic types. Remaining nodes with generics:' + genericNodes(res))
      }
      return res
    })
    if (options.optimize) {
      resPromise = resPromise.then((res) => { optimize(res); return res })
    }
    resPromise
    .then((res) => applyTypings(res, {number: 'int64', bool: 'bool', string: 'string'}))
    .then((res) => decompoundify(res))
    .then((res) => addContinuations(res, {includeControl: options.sequential}))
    .then((res) => normalize(res))
    // .then((res) => normalize(res, {createDuplicatesAndJoins: !options.sequential})) needs support in gogen
    .then((res) => remodelPorts(res))
    .then((res) => gogen.preprocess(res, options.sequential))
    .then((res) => genCode(res, {countOperations: options.countOperations}))
//    .then((res) => console.log(JSON.stringify(graphlib.json.write(res), null, 2)))
    .then((res) => console.log(res))
    .catch((err) => {
      console.error('error while transpiling')
      console.error(err.stack)
    })
  })

program
  .command('ng [json]')
  .option('-b, --bare', 'Do not resolve the json file.')
  .option('-o, --output <outputFile>', 'The output filename to generate')
  .description('Compile a program description into a program using a specific language.')
  .action((json, options) => {
    var client = lib(program.elastic)
    var resPromise = getInputGraph(json)
    if (!options.bare) {
      resPromise = resPromise.then((res) => resolve(res, client.get))
    }
    resPromise
    .then((res) => check(res))
    .then((res) => applyTypings(res, {number: 'int64', bool: 'bool', string: 'string'}))
    .then((res) => resolveLambdaTypes(res))
    .then((res) => replaceGenerics(res))
    .then((res) => {
      if (!isGenericFree(res)) {
        throw new Error('Unable to resolve all generic types. Remaining nodes with generics:' + genericNodes(res))
      }
      return res
    })
    .then((res) => decompoundify(res))
    .then((res) => addContinuations(res, {includeControl: options.sequential}))
    .then((res) => normalize(res))
    .then((res) => remodelPorts(res))
    .then((res) => console.log(JSON.stringify(graphlib.json.write(res), null, 2)))
    .catch((err) => {
      console.error('error while transpiling')
      console.error(err.stack)
    })
  })

program
  .command('ng-wg [json]')
  .option('-b, --bare', 'Do not resolve the json file.')
  .option('-o, --output <outputFile>', 'The output filename to generate')
  .description('Compile a program description into a program using a specific language.')
  .action((json, options) => {
    var client = lib(program.elastic)
    getInputGraph(json)
    .then((res) => resolve(res, client.get))
    .then((res) => check(res))
    .then((res) => addContinuations(res))
    .then((res) => normalize(res))
    .then((res) => applyTypings(res, {number: 'int64', bool: 'bool', string: 'string'}))
    .then((res) => resolveLambdaTypes(res))
    .then((res) => remodelPorts(res))
    .then((res) => replaceGenerics(res))
    .then((res) => console.log(JSON.stringify(graphlib.json.write(res), null, 2)))
    .catch((err) => {
      console.error('error while transpiling')
      console.error(err.stack)
    })
  })

program
  .command('dup [json]')
  .option('-o, --output <outputFile>', 'The output filename to generate')
  .description('Compile a program description into a program using a specific language.')
  .action((json, language, options) => {
    var client = lib(program.elastic)
    getInputGraph(json)
    .then((res) => resolve(res, client.get))
    .then((res) => check(res))
    .then((res) => addContinuations(res))
    .then((res) => normalize(res))
    .then((res) => console.log(JSON.stringify(graphlib.json.write(res))))
    .catch((err) => console.error(err.stack))
  })

program.parse(process.argv)
