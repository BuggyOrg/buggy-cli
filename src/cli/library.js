
import library from '@buggyorg/library-cli/lib/commands/commands'

export const command = 'library'
export const description = 'Library functionalities'
export const builder = (yargs) => {
  // hacky-di-hack remove demand for t
  delete yargs.getDemanded()['t']
  // add commands from library-client
  return library(yargs)
}

export const handler = (argv) => {
  global.wasCommand = true
}
