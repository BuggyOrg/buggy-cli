// #!/usr/bin/env node
/* global __dirname, process */

import * as Toolchain from './toolchain'
import * as NPM from './npm/cacheCli'
import * as NPMUpdate from './npm/updateCacheCli'
import {run} from './api'
import * as ToolAPI from './tools'
import * as Format from './format'
import yargs from 'yargs'
import cliExt from 'cli-ext'
import ora from 'ora'
import { npmWrapper as wrapProvider, getToolDisplayName } from './cli-util'

debugger

// communicate with the other cli commands via a global variable.
global.wasCommand = false

const command = (fn) => {
  return function (...args) {
    global.wasCommand = true
    fn(...args)
  }
}

var libraryURI = process.env.BUGGY_LIBRARY_HOST || 'http://localhost:8088'

const spinner = ora()
global.buggyCliSpinner = spinner // TODO remove this global

var argv = yargs
  .alias('f', 'from')
  .describe('f', 'The source format.')
  .alias('t', 'to')
  .describe('t', 'The target format.')
  .alias('u', 'updateCache')
  .describe('u', 'Update the cache (do not use cached values).')
  .alias('r', 'require')
  .describe('r', 'Add toolchain requirements to activate certain tools like "typify" to enable resolving types.')
  .array('r')
  .alias('l', 'library')
  .describe('l', 'Library URI for the component library. Defaults to BUGGY_LIBRARY_HOST or "http://localhost:8088".')
  .default('l', libraryURI)
  .global(['updateCache', 'from', 'to', 'library', 'require'])
  .demandOption('t')
  .command('list-inputs', 'List all available input types', command(() => console.log(Format.tools(ToolAPI.inputs(Toolchain, NPM)))))
  .commandDir('cli')
  .help()
  .argv

if (!global.wasCommand) {
  cliExt.input(argv._[0])
  .then((input) => {
    const provider = argv.updateCache ? NPMUpdate : NPM
    return run(input, argv.to, argv.require || [], Toolchain, wrapProvider(provider, { spinner }), {
      onStartTool (tool) {
        if (tool.consumes === tool.produces) {
          spinner.start().text = `Transform ${tool.consumes} using ${getToolDisplayName(tool)}`
        } else {
          spinner.start().text = `Transform ${tool.consumes} to ${tool.produces} using ${getToolDisplayName(tool)}`
        }
      },
      
      onFinishTool (err, tool) {
        if (err) { // note: run already printed the error
          spinner.fail()
          process.exitCode = 1
        } else {
          spinner.succeed()
        }
      },

      onStartBuildToolChain () {
        spinner.start().text = 'Build toolchain'
      },

      onFinishBuildToolchain (toolchain) {
        spinner.succeed(`Build toolchain: ${toolchain.length} ${toolchain.length === 1 ? 'step' : 'steps'}`)
      }
    })
  })
  .then((output) => {
    console.log(output)
  })
  .catch((err) => {
    process.exitCode = 1
    console.error(err.stack || err)
  })
}
