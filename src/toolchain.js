/**
 * Defines the Buggy toolchain.
 */

export const lisgy = {
  name: 'Lisgy',
  module: '@buggyorg/lisgy',
  minVersion: '0.2.0-pre.0',
  consumes: 'input',
  produces: 'portgraph',
  activatedBy: ['$<bin> pc'],
  args: '$<bin> pc'
}

export const json = {
  name: 'JSON-Parse',
  consumes: 'input',
  produces: 'portgraph',
  activatedBy: [(input) => {
    try {
      JSON.parse(input)
      return true
    } catch (err) { return false }
  }]
}

export const portgraph2kgraph = {
  name: 'Portgraph2KGraph',
  module: '@buggyorg/portgraph2kgraph',
  consumes: 'portgraph',
  produces: 'kgraph'
}

export const graphify = {
  name: 'Graphify',
  module: '@buggyorg/graphify',
  consumes: 'kgraph',
  produces: 'svg'
}

export const resolve = {
  module: '@buggyorg/resolve',
  consumes: ['portgraph'],
  produces: ['portgraph'],
  activatedBy: ['resolve']
}

export const typify = {
  module: '@buggyorg/typify',
  consumes: 'portgraph',
  produces: 'portgraph',
  depends: ['resolve'],
  activatedBy: ['typify']
}

export const optimize = {
  module: '@buggyorg/nitro',
  consumes: 'portgraph',
  produces: 'portgraph',
  depends: ['typify'],
  activatedBy: ['optimize']
}

/*
export const gogen = {
  module: '@buggyorg/codegen',
  consumes: 'portgraph',
  produces: 'go',
  depends: ['typify']
}
*/
