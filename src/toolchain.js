/**
 * Defines the Buggy toolchain.
 */

export const lisgy = {
  module: '@buggyorg/lisgy',
  produces: ['portgraph'],
  consumes: ['lisgy']
}

export const portgraph2kgraph = {
  module: '@buggyorg/portgraph2kgraph',
  produces: ['portgraph'],
  consumes: ['graph']
}

export const graphify = {
  module: '@buggyorg/graphify',
  produces: ['svg'],
  consumes: ['kgraph']
}
