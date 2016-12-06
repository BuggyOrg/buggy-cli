/* global describe, it, process */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {exec} from 'child_process'
import fs from 'fs'

chai.use(chaiAsPromised)
var expect = chai.expect

const runProgram = (program, args, data) => {
  return new Promise((resolve, reject) => {
    var cli = exec(program + ' ' + args,
      (error, stdout, stderr) => {
        if (error) {
          reject(stderr)
        } else {
          resolve(stdout)
        }
      }
    )
    if (data) {
      if (typeof data !== 'string') {
        data = JSON.stringify(data)
      }
      cli.stdin.write(data)
      cli.stdin.end()
    }
  })
}

const runCLI = (args, data) => {
  return runProgram('node lib/cli ', args, data)
}

describe('Buggy CLI - Interface', () => {
  
})
