/* global describe, it */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import * as Npm from '../src/npm/cliCommands'
import {join} from 'path'
import {tmpdir} from 'os'
import cuid from 'cuid'

const osTmpdir = () =>
  join(tmpdir(), cuid())

chai.use(chaiAsPromised)
var expect = chai.expect

describe('Buggy CLI - NPM Provider', function () {
  this.timeout(15000)
  describe('NPM CLI Provider', () => {
    it('Lists all package versions for a package', () =>
      expect(Npm.packageVersions('npm')).to.eventually.have.length.above(1)) // very conservative ;)

    it('Can get the version of a dependency', () =>
      expect(Npm.dependencyVersion('@buggyorg/buggy', '0.1.0', 'graphlib')).to.eventually.equal('2.1.0'))

    it('Returns null if the package is not dependent on the dependency', () =>
      expect(Npm.dependencyVersion('@buggyorg/buggy', '0.1.0', 'react')).to.eventually.be.not.ok)

    it('Can install a npm dependency', () =>
      expect(Npm.install('get-stdin', '5.0.1', osTmpdir())).to.be.fulfilled)

    it('Fails if the npm dependency is not installable', () =>
      expect(Npm.install('@buggyorg/non-existent-project', '5.0.1', osTmpdir())).to.be.rejected)
  })
})
