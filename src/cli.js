#!/usr/bin/env node
/* global __dirname, process */

import * as Toolchain from './toolchain'
import * as NPM from './npm/cacheCli'
import {run} from './api'
import * as ToolAPI from './tools'
import * as Format from './format'
import yargs from 'yargs'
import chalk from 'chalk'
import cliExt from 'cli-ext'

/*
prepareToolchain([Toolchain.lisgy, Toolchain.portgraph2kgraph, Toolchain.graphify], npm)
.then((res) => fancyToolchain(res))
.then((res) => console.log(res))
.catch((err) => console.error(err))
*/

global.wasCommand = false

const command = (fn) => {
  return function (...args) {
    global.wasCommand = true
    fn(...args)
  }
}

var argv = yargs
  .alias('f', 'from')
  .alias('t', 'to')
  .demand('t')
  .command('list-inputs', 'List all available input types', command(() => console.log(Format.tools(ToolAPI.inputs(Toolchain, NPM)))))
  .commandDir('cli')
  .argv

// process input the 0-th argument will be the file name..?
if (!global.wasCommand) {
  cliExt.input(argv._[0])
  .then((input) => {
    return run(input, argv.to, [], Toolchain, NPM)
  })
  .then((output) => {
    console.log(output)
  })
  .catch((err) => {console.error(err)})
}
