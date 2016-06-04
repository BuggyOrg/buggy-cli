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

  it('Compiles and runs a program with a multiplexer', () => {
    return expect(runCompiled('example/mux.json')).to.be.fulfilled
  })

  it('Creates a correct multiplexer program', () => {
    return runCompiled('example/mux.json', '1')
      .then((res) => expect(res).to.equal('4'))
      .then(() => runCompiled('example/mux.json', '77'))
      .then((res) => expect(res).to.equal('2'))
  })

  it('Compiles and runs a program with a multiplexer that controls a recursion', () => {
    return expect(runCompiled('example/factorial/factorial.json')).to.be.fulfilled
  })

  it('Creates a correct program with a multiplexer that controls a recursion', () => {
    return runCompiled('example/factorial/factorial.json', '3')
      .then((res) => expect(res).to.equal('6'))
      .then(() => runCompiled('example/factorial/factorial.json', '6'))
      .then((res) => expect(res).to.equal('720'))
  })

  it('Compiles and runs the ackermann programm', () => {
    return expect(runCompiled('example/ack.json')).to.be.fulfilled
  })

  it('Creates a correct program with a multiplexer that controls a recursion', () => {
    return runCompiled('example/ack.json', '3')
      .then((res) => expect(res).to.equal('61'))
  })

  it('Compiles and runs the filter through fold program', () => {
    return expect(runCompiled('example/reduce/functional.json')).to.be.fulfilled
  })

  it('Creates a correct filter through fold program', () => {
    return runCompiled('example/reduce/functional.json', '3,11,4,22,6,5')
      .then((fac) => expect(JSON.parse('[' + fac + ']')).to.deep.equal([3, 4, 6, 5]))
  })

  it('Compiles and runs the quicksort programm', () => {
    return expect(runCompiled('example/sort/quicksort.json')).to.be.fulfilled
  })

  it('Creates a correct quicksort program', () => {
    return runCompiled('example/sort/quicksort.json', '3,11,4,22,6,5')
      .then((qsort) => expect(JSON.parse('[' + qsort + ']')).to.deep.equal([3, 4, 5, 6, 11, 22]))
  })

  it('Compiles and runs the selection sort programm', () => {
    return expect(runCompiled('example/sort/selectionsort.clj')).to.be.fulfilled
  })

  it('Creates a correct selection sort program', () => {
    return runCompiled('example/sort/selectionsort.clj', '3,11,4,22,6,5')
      .then((qsort) => expect(JSON.parse('[' + qsort + ']')).to.deep.equal([3, 4, 5, 6, 11, 22]))
  })

  it('Compiles and runs the insertion sort programm', () => {
    return expect(runCompiled('example/sort/insertionsort.clj')).to.be.fulfilled
  })

  it('Creates a correct insertion sort program', () => {
    return runCompiled('example/sort/insertionsort.clj', '3,11,4,22,6,5')
      .then((qsort) => expect(JSON.parse('[' + qsort + ']')).to.deep.equal([3, 4, 5, 6, 11, 22]))
  })

  it('Compiles and runs the lambda-call programm', () => {
    return expect(runCompiled('example/sort/lambda.call.clj')).to.be.fulfilled
  })

  it('Creates a correct lambda-call program', () => {
    return runCompiled('example/lambda/lambda.call.clj', '')
      .then((res) => expect(res).to.deep.equal('3'))
  })
})
