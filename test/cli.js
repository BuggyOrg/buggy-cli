/* global describe, it, process */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {exec} from 'child_process'
import fs from 'fs'
import tempfile from 'tempfile'

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
    }
    cli.stdin.end()
  })
}

const runCLI = (args, data) => {
  return runProgram('node lib/cli ', args, data)
}

const runCompiled = (program, data) => {
  var tmp = tempfile('.go')
  return runCLI('compile ' + program + ' golang > ' + tmp)
    .then(() => runProgram('go run', tmp, data))
    .then((res) => { fs.unlink(tmp); return res })
}

describe('Buggy CLI', () => {
  it('Compiles and runs an increment program', () => {
    return expect(runCompiled('example/inc_explicit_types/inc.json')).to.be.fulfilled
  })

  it('Creates a correct increment program', () => {
    return runCompiled('example/inc_explicit_types/inc.json', '5')
      .then((inc) => expect(inc).to.equal('6'))
  })

  it('Compiles and runs the factorial program', () => {
    return expect(runCompiled('example/factorial/fac.json')).to.be.fulfilled
  })

  it('Creates a correct factorial program', () => {
    return runCompiled('example/factorial/fac.json', '8')
      .then((fac) => expect(fac).to.equal('40320'))
  })

  it('Compiles and runs an increment program with lambda functions', () => {
    return expect(runCompiled('example/lambda/lambda.flat.json')).to.be.fulfilled
  })

  it('Creates a correct increment program with lambda functions', () => {
    return runCompiled('example/lambda/lambda.flat.json', '77')
      .then((inc) => expect(inc).to.equal('78'))
  })

  it('Compiles and runs the map program', () => {
    return expect(runCompiled('example/reduce/map.json')).to.be.fulfilled
  })

  it('Creates a correct map program', () => {
    return runCompiled('example/reduce/map.json', '1,2,3,2,5,1')
      .then((fac) => expect(JSON.parse('[' + fac + ']')).to.deep.equal([2, 3, 4, 3, 6, 2]))
  })
})
