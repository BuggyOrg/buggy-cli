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

const runCompiledChan = (program, data) => {
  var tmp = tempfile('.go')
  return runCLI('compile ' + program + ' golang > ' + tmp)
    .then(() => runProgram('go run', tmp, data))
    .then((res) => { fs.unlink(tmp); return res })
}

const runCompiledSeq = (program, data) => {
  var tmp = tempfile('.go')
  return runCLI('compile ' + program + ' golang -s > ' + tmp)
    .then(() => runProgram('go run', tmp, data))
    .then((res) => { fs.unlink(tmp); return res })
}

describe('Buggy CLI - Channel implementations', () => {
  const runCompiled = runCompiledChan

  it('Creates a correct increment program', () => {
    return runCompiled('example/inc_explicit_types/inc.json', '5')
      .then((inc) => expect(inc).to.equal('6'))
  })

  it('Creates a correct factorial program', () => {
    return runCompiled('example/factorial/factorial.clj', '8')
      .then((fac) => expect(fac).to.equal('40320'))
  })

  it('Creates a correct increment program with lambda functions', () => {
    return runCompiled('example/lambda/lambda.flat.clj', '77')
      .then((inc) => expect(inc).to.equal('78'))
  })

  it('Creates a correct multiplexer program', () => {
    return runCompiled('example/mux.json', '1')
      .then((res) => expect(res).to.equal('4'))
      .then(() => runCompiled('example/mux.json', '77'))
      .then((res) => expect(res).to.equal('2'))
  })

  it('Creates a correct program with a multiplexer that controls a recursion', () => {
    return runCompiled('example/factorial/factorial.clj', '3')
      .then((res) => expect(res).to.equal('6'))
      .then(() => runCompiled('example/factorial/factorial.clj', '6'))
      .then((res) => expect(res).to.equal('720'))
  })

  it('Creates a correct ackermann programm', () => {
    return runCompiled('example/ack.clj', '3')
      .then((res) => expect(res).to.equal('61'))
  })

  it('Creates a correct filter through fold program', () => {
    return runCompiled('example/reduce/functional.clj', '3,11,4,22,6,5')
      .then((fac) => expect(JSON.parse('[' + fac + ']')).to.deep.equal([3, 4, 6, 5]))
  })

  it('Creates a correct quicksort program', () => {
    return runCompiled('example/sort/quicksort.clj', '3,11,4,22,6,5')
      .then((qsort) => expect(JSON.parse('[' + qsort + ']')).to.deep.equal([3, 4, 5, 6, 11, 22]))
  })

  it('Creates a correct selection sort program', () => {
    return runCompiled('example/sort/selectionsort.clj', '3,11,4,22,6,5')
      .then((qsort) => expect(JSON.parse('[' + qsort + ']')).to.deep.equal([3, 4, 5, 6, 11, 22]))
  })

  it('Creates a correct insertion sort program', () => {
    return runCompiled('example/sort/insertionsort.clj', '3,11,4,22,6,5')
      .then((qsort) => expect(JSON.parse('[' + qsort + ']')).to.deep.equal([3, 4, 5, 6, 11, 22]))
  })

  it('Creates a correct lambda-call program', () => {
    return runCompiled('example/lambda/lambda.call.clj', '2')
      .then((res) => expect(res).to.deep.equal('3'))
  })
})

describe('Buggy CLI - Sequential implementations', () => {
  const runCompiled = runCompiledSeq

  it('Creates a correct increment program', () => {
    return runCompiled('example/inc_explicit_types/inc.json', '5')
      .then((inc) => expect(inc).to.equal('6'))
  })

  it('Creates a correct factorial program', () => {
    return runCompiled('example/factorial/factorial.clj', '8')
      .then((fac) => expect(fac).to.equal('40320'))
  })

  it('Creates a correct increment program with lambda functions', () => {
    return runCompiled('example/lambda/lambda.flat.clj', '77')
      .then((inc) => expect(inc).to.equal('78'))
  })

  it('Creates a correct multiplexer program', () => {
    return runCompiled('example/mux.json', '1')
      .then((res) => expect(res).to.equal('4'))
      .then(() => runCompiled('example/mux.json', '77'))
      .then((res) => expect(res).to.equal('2'))
  })

  it('Creates a correct program with a multiplexer that controls a recursion', () => {
    return runCompiled('example/factorial/factorial.clj', '3')
      .then((res) => expect(res).to.equal('6'))
      .then(() => runCompiled('example/factorial/factorial.clj', '6'))
      .then((res) => expect(res).to.equal('720'))
  })

  it.only('Creates a correct ackermann programm', () => {
    return runCompiled('example/ack.clj', '3')
      .then((res) => expect(res).to.equal('61'))
  })

  it('Creates a correct filter through fold program', () => {
    return runCompiled('example/reduce/functional.clj', '3,11,4,22,6,5')
      .then((fac) => expect(JSON.parse('[' + fac + ']')).to.deep.equal([3, 4, 6, 5]))
  })

  it('Creates a correct quicksort program', () => {
    return runCompiled('example/sort/quicksort.clj', '3,11,4,22,6,5')
      .then((qsort) => expect(JSON.parse('[' + qsort + ']')).to.deep.equal([3, 4, 5, 6, 11, 22]))
  })

  it('Creates a correct selection sort program', () => {
    return runCompiled('example/sort/selectionsort.clj', '3,11,4,22,6,5')
      .then((qsort) => expect(JSON.parse('[' + qsort + ']')).to.deep.equal([3, 4, 5, 6, 11, 22]))
  })

  it('Creates a correct insertion sort program', () => {
    return runCompiled('example/sort/insertionsort.clj', '3,11,4,22,6,5')
      .then((qsort) => expect(JSON.parse('[' + qsort + ']')).to.deep.equal([3, 4, 5, 6, 11, 22]))
  })

  it('Creates a correct lambda-call program', () => {
    return runCompiled('example/lambda/lambda.call.clj', '2')
      .then((res) => expect(res).to.deep.equal('3'))
  })
})
