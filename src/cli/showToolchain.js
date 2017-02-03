
import * as Toolchain from '../toolchain'
import * as Format from '../format'
import {toolchainSequence, toolchainSequenceFromInput} from '../api'
import * as NPM from '../npm/cacheCli'
import * as NPMUpdate from '../npm/updateCacheCli'
import {input} from 'cli-ext'
import wrapProvider from '../cli-util/npmWrapper'

export const command = 'show-toolchain'
export const description = 'Show the toolchain to create a given output'
export const builder = (yargs) => {
  return yargs
    .demandOption(['to'])
}

export const handler = (argv) => {
  global.wasCommand = true
  const provider = argv.updateCache ? NPMUpdate : NPM
  const wrappedProvider = wrapProvider(provider, { spinner: global.buggyCliSpinner })
  var sequencePromise
  if (argv.from) {
    sequencePromise = toolchainSequence(argv.from, argv.to, argv.require || [], Toolchain, wrappedProvider)
  } else {
    sequencePromise = input(argv._[1])
    .then((contents) => toolchainSequenceFromInput(contents, argv.to, argv.require || [], Toolchain, wrappedProvider))
  }
  sequencePromise
  .then((sequence) => Format.fancyToolchain(sequence))
  .then((sequence) => console.log(sequence))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
