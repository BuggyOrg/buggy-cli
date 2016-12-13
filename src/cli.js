#!/usr/bin/env node
/* global __dirname, process */

import * as Toolchain from './toolchain'
import * as NPM from './npm/cacheCli'
import * as NPMUpdate from './npm/updateCacheCli'
import {run} from './api'
import * as ToolAPI from './tools'
import * as Format from './format'
import yargs from 'yargs'
import cliExt from 'cli-ext'

// communicate with the other cli commands via a global variable.
global.wasCommand = false

const command = (fn) => {
  return function (...args) {
    global.wasCommand = true
    fn(...args)
  }
}

var libraryURI = process.env.BUGGY_LIBRARY_HOST || 'http://localhost:8088'

var argv = yargs
  .alias('f', 'from')
  .describe('f', 'The source format.')
  .alias('t', 'to')
  .describe('t', 'The target format.')
  .alias('u', 'updateCache')
  .describe('u', 'Update the cache (do not use cached values).')
  .alias('l', 'library')
  .describe('l', 'Library URI for the component library. Defaults to BUGGY_LIBRARY_HOST or "http://localhost:8088".')
  .default('l', libraryURI)
  .global(['updateCache', 'from', 'to', 'library'])
  .demand('t')
  .command('list-inputs', 'List all available input types', command(() => console.log(Format.tools(ToolAPI.inputs(Toolchain, NPM)))))
  .commandDir('cli')
  .help()
  .argv

if (!global.wasCommand) {
  cliExt.input(argv._[0])
  .then((input) => {
    var provider = NPM
    if (argv.updateCache) {
      provider = NPMUpdate
    }
    return run(input, argv.to, [], Toolchain, provider)
  })
  .then((output) => {
    console.log(output)
  })
  .catch((err) => { console.error(err) })
}
