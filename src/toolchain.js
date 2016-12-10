/**
 * Defines the Buggy toolchain.
 */

export const lisgy = {
  name: 'lisgy',
  module: '@buggyorg/lisgy',
  minVersion: '0.2.0-pre.0',
  consumes: 'input',
  produces: 'portgraph',
  activatedBy: ['$<bin> $<args>'],
  args: 'pc'
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
  }]
}

export const portgraph2kgraph = {
  name: 'portgraph2kgraph',
  module: '@buggyorg/portgraph2kgraph',
  consumes: 'portgraph',
  produces: 'kgraph'
}

export const graphify = {
  name: 'graphify',
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
