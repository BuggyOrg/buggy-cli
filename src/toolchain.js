/**
 * Defines the Buggy toolchain.
 */

export const lisgy = {
  name: 'lisgy',
  module: '@buggyorg/lisgy',
  minVersion: '0.2.0-pre.4',
  consumes: 'input',
  produces: 'portgraph',
  activatedBy: ['$<bin>'],
  args: ''
}

export const portgraphJSON = {
  name: 'portgraphJSON',
  consumes: 'input',
  produces: 'portgraph',
  activatedBy: [(input) => {
    try {
      const parsed = JSON.parse(input)
      return parsed.nodes != null // when children is defined it is a kgraph
    } catch (err) { return false }
  }],
  command: (input) => input
}

export const kgraphJSON = {
  name: 'kgraphJSON',
  consumes: 'input',
  produces: 'kgraph',
  activatedBy: [(input) => {
    try {
      const parsed = JSON.parse(input)
      return parsed.children != null // when children is defined it is a kgraph
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

export const html = {
  name: 'html',
  module: '@buggyorg/graphify',
  consumes: 'kgraph',
  args: '-p',
  produces: 'html'
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
  name: 'typify',
  module: '@buggyorg/typify',
  consumes: 'portgraph',
  produces: 'portgraph',
  depends: ['resolve'],
  activatedBy: ['typify']
}

/*
export const optimize = {
  module: '@buggyorg/nitro',
  consumes: 'portgraph',
  produces: 'portgraph',
  depends: ['typify'],
  activatedBy: ['optimize']
}

export const gogen = {
  module: '@buggyorg/codegen',
  consumes: 'portgraph',
  produces: 'go',
  depends: ['typify']
}
*/
