/* global describe, it, process, beforeEach, afterEach */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import fs from 'fs-extra'
import {join} from 'path'
import {tmpdir} from 'os'
import * as Tools from '../src/tools'
import semver from 'semver'
import * as Npm from '../src/npm/cliCommands'
import cuid from 'cuid'

chai.use(chaiAsPromised)
var expect = chai.expect

const osTmpdir = () =>
  join(tmpdir(), cuid())

// Make sure not to delete the contents of the real BUGGY_LOCAL_PATH
// before the first test!
process.env.BUGGY_LOCAL_PATH = osTmpdir()

describe('Buggy CLI - Tools', function () {
  describe('Package initialization', function () {
    this.timeout(15000)
    beforeEach(() => {
      process.env.BUGGY_LOCAL_PATH = osTmpdir()
      fs.removeSync(Tools.cachePath())
    })

    /* afterEach(() => {
      fs.removeSync(Tools.cachePath())
    }) */

    it('Successfully Initializes a new buggy cache', () => {
      return Tools.init()
      .then((init) => {
        expect(init).to.be.true
      })
    })

    it('Initializes the buggy local path with no dependencies', () => {
      return Tools.listTools()
      .then((tools) => {
        expect(tools).to.have.length(0)
      })
    })

    it('Installs dependencies into the local path', function () {
      this.timeout(40000)
      return Tools.install({module: '@buggyorg/graphtools', version: '0.4.0-pre.7'}, Npm)
      .then(() => Tools.listTools())
      .then((tools) => {
        expect(tools).to.have.length(1)
        expect(tools[0].module).to.equal('@buggyorg/graphtools')
        expect(semver.satisfies('0.4.0-pre.7', tools[0].version)).to.be.true
      })
    })
  })

  describe('Package meta queries', () => {
    // dummy provider creator
    const provider = (dep, pkgs) => ({
      dependencyVersion: () => Promise.resolve(dep),
      packageVersions: () => Promise.resolve(pkgs)
    })

    describe('Package versions via `gatherVersions`', () => {
      it('Gets the package versions out of the provider', () =>
        expect(Tools.gatherVersions('', provider(null, ['0.1.0']))).to.eventually.eql(['0.1.0']))
    })

    describe('Graphtools dependency', () => {
      it('Only accepts graphtool versions from 0.4.0 and above', () => {
        expect(Tools.validGraphtoolsVersion('0.1.0')).to.be.false
        expect(Tools.validGraphtoolsVersion('0.3.0')).to.be.false
        expect(Tools.validGraphtoolsVersion('0.4.0')).to.be.true
        expect(Tools.validGraphtoolsVersion('2.0.0')).to.be.true
      })

      it('Gets the dependencies out of the provider', () =>
        expect(Tools.graphtoolDependency('', '', provider('0.5.0'))).to.eventually.equal('0.5.0'))

      it('Returns null if the dependency is not defined', () =>
        expect(Tools.graphtoolDependency('', '', provider())).to.eventually.be.not.ok)

      it('Can check whether a package satisfies the graphtools dependency', () => {
        expect(Promise.all([
          Tools.satisfies({graphtools: '0.4.0'}, '0.4.0-pre.7'),
          Tools.satisfies({graphtools: '0.3.0'}, '0.4.0-pre.7'),
          Tools.satisfies({graphtools: '1.2.0'}, '0.4.0-pre.7')
        ])).to.eventually.eql([true, false, true])
      })

      it('Checks the registry for determining if a package satisfies the dependency', () =>
        expect(Tools.satisfies({module: 'A'}, '0.2.0', provider('0.3.0'))).to.eventually.be.true)
    })

    describe('Valid Tool versions', () => {
      it('Gathers all valid versions', () =>
        Tools.validToolVersions({module: 'A'}, provider('0.5.0', ['0.2.0']))
        .then((tool) => {
          expect(tool).to.be.an('array')
          expect(tool[0].graphtools).to.equal('0.5.0')
          expect(tool[0].version).to.equal('0.2.0')
        }))

      it('Omits packages with deprecated graphtool dependencies', () =>
        expect(Tools.validToolVersions({module: 'A'}, provider('0.1.0', ['0.2.0'])))
        .to.eventually.eql([]))

      it('Omits graphtools, if not dependent', () =>
        Tools.validToolVersions({module: 'A'}, provider(null, ['0.1.0']))
        .then((tool) => {
          expect(tool[0].graphtools).to.not.be.ok
        }))
    })

    describe('Execution', () => {
      it('Can execute a cli tool', () => {
        var provider = {cliInterface: () => Promise.resolve('cat')}
        return expect(Tools.execute({module: 'a', version: '1.0.0', noNode: true}, 'abc', provider))
        .to.eventually.equal('abc')
      })

      it('Fails if program fails', () => {
        var provider = {cliInterface: () => Promise.resolve('grep')} // grep without arguments fails..
        return expect(Tools.execute({module: 'a', version: '1.0.0', noNode: true}, 'abc', provider))
        .to.be.rejected
      })

      it('Can run a program with a set of arguments', () => {
        var provider = {cliInterface: () => Promise.resolve('echo')}
        return expect(Tools.execute({module: 'a', version: '1.0.0', args: ['abc'], noNode: true}, '', provider))
        .to.eventually.equal('abc')
      })
    })
  })
})
