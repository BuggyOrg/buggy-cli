/* global describe, it */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import * as API from '../src/api'

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
        {module: 'echo', version: '1.0.0', args: 'testString'},
        {module: 'cat', version: '1.0.0'}
      ], '', {cliInterface: (prog) => Promise.resolve(prog)}))
      .to.eventually.equal('testString')
    })

    it('Captures the error message if a tool fails', () => {
      return expect(API.runToolChain([
        {module: 'echo', version: '1.0.0', args: 'testString'},
        {module: 'grep', version: '1.0.0'}
      ], '', {cliInterface: (prog) => Promise.resolve(prog)}))
      .to.eventually.be.rejectedWith(/grep/)
    })
  })
})
