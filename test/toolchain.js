/* global describe, it, process */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import * as ToolchainGen from '../src/toolchainGen'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

chai.use(chaiAsPromised)
chai.use(sinonChai)
var expect = chai.expect

describe('Buggy CLI - Toolchain', function () {
  describe('Inputs', () => {
    it('Input tools are called with the input for activation', () => {
      const spy = sinon.stub().returns(true)
      const provider = {packageVersions: () => Promise.resolve(['0.1.0']), install: () => Promise.resolve()}
      const toolchain = {tool1: {activatedBy: spy, consumes: ['input']}}
      return ToolchainGen.matchingInputTools('test', toolchain, provider)
      .then(() => {
        expect(spy).to.be.calledWith('test')
      })
    })

    it('Selects input tools by activation value', () => {
      const spy = sinon.stub().returns(true)
      const provider = {packageVersions: () => Promise.resolve(['0.1.0']), install: () => Promise.resolve()}
      const toolchain = {tool1: {name: 'tool1', activatedBy: spy, consumes: ['input']}}
      return ToolchainGen.matchingInputTools('test', toolchain, provider)
      .then((matching) => expect(matching[0].name).to.equal('tool1'))
    })

    it('Selects input by CLI', () => {
      const toolchain = {
        tool1: {name: 'tool1', activatedBy: 'grep', consumes: ['input'], noNode: true},
        tool2: {name: 'tool2', activatedBy: 'echo $<input>', consumes: ['input'], noNode: true}
      }
      const provider = {packageVersions: () => Promise.resolve(['0.1.0']), install: () => Promise.resolve(), cliInterface: () => Promise.resolve('')}
      return ToolchainGen.matchingInputTools('test', toolchain, provider)
      .then((matching) => expect(matching).to.have.length(1))
    })
  })

  describe('Dependencies', () => {
    it('Deals with dependencies for in-between tools', () => {
      const toolchain = {
        A: {name: 'A', consumes: '-', produces: 'outA'},
        B: {name: 'B', consumes: 'inB', produces: '--'},
        C: {name: 'C', consumes: 'inC', produces: 'outC', depends: ['depC']},
        transform2: {name: 'transform2', consumes: 'outA', produces: 'inC'},
        transform3: {name: 'transform3', consumes: 'outC', produces: 'inB'},
        depC: {name: 'depC', consumes: 'inC', produces: 'inC', activatedBy: 'depC'}
      }
      var newSeq = ToolchainGen.connectTools(['A', 'B'].map((t) => toolchain[t]), toolchain)
      var depSeq = ToolchainGen.sequenceDependencies(newSeq, toolchain)
      expect(depSeq.map((t) => t.name)).to.eql(['A', 'transform2', 'depC', 'C', 'transform3', 'B'])
    })

    it('Only inserts dependencies once', () => {
      const toolchain = {
        A: {name: 'A', consumes: '-', produces: 'outA'},
        B: {name: 'B', consumes: 'inB', produces: '--', depends: ['depC']},
        C: {name: 'C', consumes: 'inC', produces: 'outC', depends: ['depC']},
        transform2: {name: 'transform2', consumes: 'outA', produces: 'inC'},
        transform3: {name: 'transform3', consumes: 'outC', produces: 'inB'},
        depC: {name: 'depC', consumes: 'inC', produces: 'inC', activatedBy: 'depC'}
      }
      var newSeq = ToolchainGen.connectTools(['A', 'B'].map((t) => toolchain[t]), toolchain)
      var depSeq = ToolchainGen.sequenceDependencies(newSeq, toolchain)
      expect(depSeq.map((t) => t.name)).to.eql(['A', 'transform2', 'depC', 'C', 'transform3', 'B'])
    })

    it('Fails with cyclic dependencies', () => {
      const toolchain = {
        B: {name: 'B', depends: ['D']}, C: {name: 'C', depends: []},
        D: {name: 'D', depends: ['E']}, E: {name: 'E', depends: ['B', 'C']}
      }
      expect(() => ToolchainGen.outputDependencies({depends: ['B'], name: 'A'}, toolchain, {}))
      .to.throw(/cycles/)
    })
  })

  describe('Connecting sequence', () => {
    it('Can ignore already connected sequences', () => {
      const toolchain = {
        A: {name: 'A', consumes: '-', produces: 'data'},
        B: {name: 'B', consumes: 'data', produces: '--'}
      }
      var newSeq = ToolchainGen.connectTools(['A', 'B'].map((t) => toolchain[t]), toolchain)
      expect(newSeq.map((t) => t.name)).to.eql(['A', 'B'])
    })

    it('Can connect tools of different types', () => {
      const toolchain = {
        A: {name: 'A', consumes: '-', produces: 'outA'},
        B: {name: 'B', consumes: 'inB', produces: '--'},
        transform: {name: 'transform', consumes: 'outA', produces: 'inB'}
      }
      var newSeq = ToolchainGen.connectTools(['A', 'B'].map((t) => toolchain[t]), toolchain)
      expect(newSeq.map((t) => t.name)).to.eql(['A', 'transform', 'B'])
    })

    it('Throws an exception if it is not possible to connect the two processes', () => {
      const toolchain = {
        A: {name: 'A', consumes: '-', produces: 'outA'},
        B: {name: 'B', consumes: 'inB', produces: '--'},
        transform: {name: 'transform', consumes: 'inA', produces: 'inB'}
      }
      expect(() => ToolchainGen.connectTools(['A', 'B'].map((t) => toolchain[t]), toolchain))
      .to.throw(Error)
    })

    it('Can handle multiple connections', () => {
      const toolchain = {
        A: {name: 'A', consumes: '-', produces: 'outA'},
        B: {name: 'B', consumes: 'inB', produces: '--'},
        C: {name: 'C', consumes: 'inC', produces: 'outC'},
        transform: {name: 'transform', consumes: 'outA', produces: 'inB'},
        transform2: {name: 'transform2', consumes: 'outA', produces: 'inC'},
        transform3: {name: 'transform3', consumes: 'outC', produces: 'inB'}
      }
      var newSeq = ToolchainGen.connectTools(['A', 'B'].map((t) => toolchain[t]), toolchain)
      expect(newSeq.map((t) => t.name)).to.eql(['A', 'transform', 'B'])
    })

    it('Can handle longer connections', () => {
      const toolchain = {
        A: {name: 'A', consumes: '-', produces: 'outA'},
        B: {name: 'B', consumes: 'inB', produces: '--'},
        C: {name: 'C', consumes: 'inC', produces: 'outC'},
        transform2: {name: 'transform2', consumes: 'outA', produces: 'inC'},
        transform3: {name: 'transform3', consumes: 'outC', produces: 'inB'}
      }
      var newSeq = ToolchainGen.connectTools(['A', 'B'].map((t) => toolchain[t]), toolchain)
      expect(newSeq.map((t) => t.name)).to.eql(['A', 'transform2', 'C', 'transform3', 'B'])
    })
  })
})
