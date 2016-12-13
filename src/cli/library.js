
import library from '@buggyorg/library-cli/lib/commands/commands'

export const command = 'library'
export const description = 'Library functionalities'
export const builder = (yargs) => {
  // add commands from library-client
  return library(yargs)
}

export const handler = (argv) => {
}
