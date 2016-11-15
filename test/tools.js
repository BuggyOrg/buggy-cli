/* global describe, it, process */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {exec} from 'child-process-promise'
import fs from 'fs'
import tempfile from 'tempfile'

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

describe('Buggy CLI - Tools', () => {
  
})