import {exec} from 'child_process'
import fs from 'fs'
import tempfile from 'tempfile'
import _ from 'lodash'

const runProgram = (program, args, data) => {
  return new Promise((resolve, reject) => {
    console.log(program + ' ' + args)
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
  return runProgram('node ../lib/cli ', args, data)
}

var sizes = [1e2, 3e2, 6e2, 1e3, 2e3, 4e3, 6e3, 1e4, 1.3e4, 1.6e4, 2e4, 2.5e4, 2.7e4]
var lists = sizes.map((s) => _.shuffle(_.range(s)))

function runSerial (tasks) {
  return tasks.reduce((promise, task) => promise.then((results) => task().then((result) => [ ...results, result ])), Promise.resolve([]))
}

var goFile = tempfile('.go')
var exeFile = tempfile('.run')
console.log('building')
runCLI('compile sort/quicksort.clj golang -s > ' + goFile)
.then(() => runProgram('go build', ' -o ' + exeFile + ' -i ' + goFile))
.then(() => {
  console.log('built: ', exeFile, ' from ', goFile)
  return runSerial(lists.map((list) => () => {
    const start = new Date().getTime()
    return runProgram(exeFile, goFile, list.join(','))
      .then(() => ({ time: (new Date().getTime()) - start, n: list.length }))
  }))
})
.then((times) => {
  times.forEach((time) => console.log(time.n + ', ' + time.time))
})
.catch((err) => {
  console.error(err)
})
