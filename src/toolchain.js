/**
 * Defines the Buggy toolchain.
 */

export const lisgy = {
  module: '@buggyorg/lisgy',
  minVersion: '0.2.0-pre.0',
  produces: ['portgraph'],
  consumes: ['lisgy']
}

export const portgraph2kgraph = {
  module: '@buggyorg/portgraph2kgraph',
  produces: ['kgraph'],
  consumes: ['portgraph']
}

export const graphify = {
  module: '@buggyorg/graphify',

  minVersion: '0.1.25', //TODO FIX THIS: This constraint is only for test purposes!

  produces: ['svg'],
  consumes: ['kgraph']
}
