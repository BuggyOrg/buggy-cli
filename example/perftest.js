import {exec} from 'child_process'
import fs from 'fs'
import tempfile from 'tempfile'
import _ from 'lodash'

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
  return runProgram('node ../lib/cli ', args, data)
}

var list = _.shuffle(_.range(15000))
var start

var goFile = tempfile('.go')
console.log('building')
runCLI('compile sort/quicksort_mux.clj golang > ' + goFile)
.then(() => {
  console.log('built: ', goFile)
  start = new Date().getTime()
  return runProgram('go run', goFile, list.join(','))
})
.then(() => {
  var end = new Date().getTime()
  console.log('runtime', end - start)
})
.catch((err) => {
  console.error(err)
})
