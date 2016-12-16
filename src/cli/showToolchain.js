
import * as Toolchain from '../toolchain'
import * as Format from '../format'
import {toolchainSequence, toolchainSequenceFromInput} from '../api'
import * as NPM from '../npm/cacheCli'
import * as NPMUpdate from '../npm/updateCacheCli'
import {input} from 'cli-ext'

export const command = 'show-toolchain'
export const description = 'Show the toolchain to create a given output'
export const builder = (yargs) => {
  return yargs
    .demand(['to'])
}

export const handler = (argv) => {
  global.wasCommand = true
  var provider = NPM
  if (argv.updateCache) {
    provider = NPMUpdate
  }
  var sequencePromise
  if (argv.from) {
    sequencePromise = toolchainSequence(argv.from, argv.to, [], Toolchain, provider)
  } else {
    sequencePromise = input(argv._[1])
    .then((contents) => toolchainSequenceFromInput(contents, argv.to, [], Toolchain, provider))
  }
  sequencePromise
  .then((sequence) => Format.fancyToolchain(sequence))
  .then((sequence) => console.log(sequence))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
