/**
 * Defines the Buggy toolchain.
 */

export const lisgy = {
  name: 'lisgy',
  module: '@buggyorg/lisgy',
  minVersion: '0.2.0-pre.1',
  consumes: 'input',
  produces: 'portgraph',
  activatedBy: ['$<bin> input'],
  args: 'input'
}

export const json = {
  name: 'json',
  consumes: 'input',
  produces: 'portgraph',
  activatedBy: [(input) => {
    try {
      JSON.parse(input)
      return true
    } catch (err) { return false }
  }],
  command: (input) => input
}

export const component = {
  name: 'component',
  consumes: 'portgraph',
  produces: 'component',
  command: (portgraph) => {
    if (portgraph.componentId) return portgraph
    if (JSON.parse(portgraph).componentId) return JSON.parse(portgraph)
    return JSON.parse(portgraph).components[0]
  }
}

export const portgraph2kgraph = {
  name: 'portgraph2kgraph',
  module: '@buggyorg/portgraph2kgraph',
  consumes: 'portgraph',
  depends: ['resolve'],
  produces: 'kgraph'
}

export const graphify = {
  name: 'graphify',
  module: '@buggyorg/graphify',
  consumes: 'kgraph',
  produces: 'svg'
}

export const resolve = {
  name: 'resolve',
  module: '@buggyorg/resolve',
  minVersion: '0.2.2',
  consumes: 'portgraph',
  produces: 'portgraph',
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
