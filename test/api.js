/* global describe, it */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import * as API from '../src/api'
import * as NPM from '../src/npm/cliCommands'

chai.use(chaiAsPromised)
var expect = chai.expect

describe('Buggy API', () => {
  describe('Sequences', () => {
    describe('Version management', () => {
      it('Gathers all available valid versions', () => {
        var provider = {
          dependencyVersion: (p, v) => Promise.resolve(v),
          packageVersions: () => Promise.resolve(['0.4.0', '0.5.0'])
        }
        return API.allValidVersions(['a', 'b'], provider)
        .then((vvs) => {
          expect(vvs).to.be.ok
          expect(vvs).to.have.length(2)
        })
      })

      it('Rejects invalid versions', () => {
        var provider = {
          dependencyVersion: (p, v) => Promise.resolve(v),
          packageVersions: () => Promise.resolve(['0.0.0', '0.2.0', '0.5.0'])
        }
        return API.allValidVersions(['a', 'b'], provider)
        .then((vvs) => {
          expect(vvs).to.be.ok
          expect(vvs).to.have.length(1)
        })
      })

      it('Finds a graphtools version for a sequence', () => {
        var provider = {
          dependencyVersion: (p, v) => Promise.resolve(v),
          packageVersions: () => Promise.resolve(['0.4.0', '0.5.0'])
        }
        return expect(API.pinpointSequenceVersions(['a', 'b'], provider))
          .to.eventually.equal('0.5.0')
      })
    })
  })

  describe('Runner', () => {
    it('Runs the tools in the tool chain', () => {
      return expect(API.runToolChain([
        {module: 'echo', version: '1.0.0', args: 'testString', noNode: true},
        {module: 'cat', version: '1.0.0', noNode: true}
      ], '', {cliInterface: (prog) => Promise.resolve(prog)}))
      .to.eventually.equal('testString')
    })

    it('Captures the error message if a tool fails', () => {
      return expect(API.runToolChain([
        {module: 'echo', version: '1.0.0', args: 'testString', noNode: true},
        {module: 'grep', version: '1.0.0', noNode: true}
      ], '', {cliInterface: (prog) => Promise.resolve(prog)}))
      .to.eventually.be.rejectedWith(/grep/)
    })

    it('Can run an installed package', function () {
      this.timeout(60000)
      return expect(API.prepareToolchain([{module: '@buggyorg/portgraph2kgraph'}], NPM)
      .then((toolchain) => API.runToolChain(toolchain, '{"nodes": [], "edges": []}', NPM)))
      .to.be.fulfilled
    })
  })

  describe('Toolchain generation', () => {
    it('Creates a toolchain for an input and output', () => {
      const toolchain = {
        A: {name: 'A', consumes: 'input', produces: 'go', activatedBy: () => true}
      }
      return API.createSequence(toolchain['A'], 'go', [], toolchain, {cliInterface: () => 'echo a'})
      .then((sequence) => expect(sequence.map((tool) => tool.name)).to.eql(['A']))
    })

    it('Creates a toolchain for an complex example', () => {
      const toolchain = {
        A: {name: 'A', consumes: 'input', produces: 'json', activatedBy: () => true},
        B: {name: 'B', consumes: 'input', produces: 'json', activatedBy: () => false},
        C: {name: 'C', consumes: 'json', produces: 'json'},
        D: {name: 'D', consumes: 'json', produces: 'json', depends: ['C']},
        E: {name: 'E', consumes: 'json', produces: 'out'},
        F: {name: 'F', consumes: 'json', produces: '-1-'},
        G: {name: 'G', consumes: '-1-', produces: 'out'}
      }
      return API.createSequence(toolchain['A'], 'out', ['D'], toolchain, {cliInterface: () => 'echo a'})
      .then((sequence) => 
        expect(sequence.map((tool) => tool.name)).to.eql(['A', 'C', 'D', 'E']))
    })

    it('Fails if no sequence is available', () => {
      const toolchain = {
        A: {name: 'A', consumes: 'input', produces: 'json', activatedBy: () => true},
        B: {name: 'B', consumes: 'input', produces: 'json', activatedBy: () => false},
        C: {name: 'C', consumes: 'json', produces: 'json'},
        D: {name: 'D', consumes: 'json', produces: 'json', depends: ['C']},
        F: {name: 'F', consumes: 'json', produces: '-1-'},
      }
      return expect(API.createSequence('A', 'out', ['D'], toolchain, {cliInterface: () => 'echo a'}))
      .to.be.rejected
    })
  })

  describe.only('Conversion tools', () => {
    it('Gets the input string for the graph', () => {
      const toolchain = {
        A: {name: 'A', consumes: 'input', produces: 'json', activatedBy: () => true},
        B: {name: 'B', consumes: 'input', produces: 'json', activatedBy: () => false}
      }
      expect(API.graphToInputFormat({metaInformation: {A: '<test>'}}, toolchain,
        {
          packageVersions: () => Promise.resolve(['0.1.0']),
          dependencyVersion: (p, v) => Promise.resolve(v)
        }))
      .to.eventually.equal('<test>')
    })
  })
})
