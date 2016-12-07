
import * as Toolchain from '../toolchain'
import * as Format from '../format'
import {toolchainSequence} from '../api'
import * as NPM from '../npm/cliCommands'

export const command = 'show-toolchain'
export const description = 'Show the toolchain to create a given output'
export const builder = (yargs) => {
  return yargs.demand(['from', 'to'])
}

export const handler = (argv) => {
  toolchainSequence(argv.from, argv.to, [], Toolchain, NPM)
  .then((sequence) => Format.fancyToolchain(sequence))
  .then((sequence) => console.log(sequence))
}
