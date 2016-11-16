/* global describe, it, process, beforeEach, afterEach */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {exec} from 'child-process-promise'
import fs from 'fs-extra'
import {join} from 'path'
import {tmpdir} from 'os'
import * as Tools from '../src/tools'
import semver from 'semver'

chai.use(chaiAsPromised)
var expect = chai.expect

const runProgram = (program, args, data) => {
  var execProm = exec(program, args)
  var cp = execProm.childProcess
  if (data) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data)
    }
    cp.stdin.write(data)
  }
  cp.stdin.end()
  return execProm
}

const runCLI = (args, data) => {
  return runProgram('node lib/cli ', args, data)
}

// Make sure not to delete the contents of the real BUGGY_LOCAL_PATH
// before the first test!
process.env.BUGGY_LOCAL_PATH = ''

var testCounter = 1

describe('Buggy CLI - Tools', function () {
  describe('Package initialization', function () {
    this.timeout(10000)
    beforeEach(() => {
      process.env.BUGGY_LOCAL_PATH = join(tmpdir(), '' + testCounter++)
      fs.removeSync(Tools.cachePath())
    })

    afterEach(() => {
      fs.removeSync(Tools.cachePath())
    })

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
      return Tools.install('@buggyorg/graphtools@0.4.0-pre.7')
      .then(() => Tools.listTools())
      .then((tools) => {
        expect(tools).to.have.length(1)
        expect(tools[0].name).to.equal('@buggyorg/graphtools')
        expect(semver.satisfies('0.4.0-pre.7', tools[0].version)).to.be.true
      })
    })
  })

  describe('Working with packages', function () {
    this.timeout(10000)
    beforeEach(() => {
      process.env.BUGGY_LOCAL_PATH = join(tmpdir(), '' + testCounter++)
      fs.removeSync(Tools.cachePath())
      fs.mkdirpSync(Tools.cachePath())
      fs.copySync('./test/fixtures/baseCache/', Tools.cachePath())
    })

    afterEach(() => {
      fs.removeSync(Tools.cachePath())
    })

    it('Successfully gets the entry point for a package', () => {
      return Tools.entryPoint('test')
      .then((entry) => {
        expect(entry).to.match(/test\/index.js$/)
      })
    })

    it('Gets the API for an package', () => {
      return Tools.toolAPI('test')
      .then((api) => {
        expect(api).to.be.an('object')
        expect(api.name).to.equal('test')
      })
    })
  })
})
