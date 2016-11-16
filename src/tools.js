/**
 * Gather tools necessary for transformations.
 */

import {join} from 'path'
import os from 'os'
import mkdirp from 'mkdirp-then'
import {exec} from 'child-process-promise'
import fs from 'fs'

const systemAppDir = () =>
  process.env.APPDATA ||
    (process.platform === 'darwin'
      ? join(os.homedir(), 'Library/Preferences')
      : join(os.homedir(), '/.local/share'))

const buggyLocal = () => process.env.BUGGY_LOCAL_PATH || systemAppDir()
const buggyDir = () => join(buggyLocal(), 'buggy', require('../package.json').version)

export const cachePath = buggyDir

const isNPMDependency = (dep) => {
  return Promise.resolve(true)
}

export const init = () => {
  return mkdirp(buggyDir())
  .then(() => exec('npm init -f', {cwd: buggyDir()}))
  .then(() => true)
}

const dependenciesToArray = (deps) =>
  Object.keys(deps).map((d) => ({name: d, version: deps[d]}))

const getPackageJson = (path) =>
  JSON.parse(fs.readFileSync(join(path, 'package.json')))

export const listTools = () => {
  return init()
  .then(() => dependenciesToArray(getPackageJson(buggyDir()).dependencies || {}))
}

const installNPM = (dependency) => {
  return exec('npm i --save ' + dependency, {cwd: buggyDir()})
}

export const install = (dependency) => {
  return init()
  .then(() => isNPMDependency(dependency))
  .then((isNPM) => {
    if (isNPM) {
      return installNPM(dependency)
    } else {
      throw new Error('Cannot install ' + dependency)
    }
  })
}

export const entryPoint = (dependency) => {
  return listTools()
  .then((tools) => {
    if (tools.find((elem) => elem.name === dependency) !== -1) {
      return
    } else {
      return install(dependency)
    }
  })
  .then(() => getPackageJson(join(buggyDir(), 'node_modules', dependency)))
  .then((pkg) => join(buggyDir(), 'node_modules', dependency, pkg.main))
}

export const toolAPI = (dependency) => {
  return entryPoint(dependency)
  .then((entry) => exec('node -e "console.log(JSON.stringify(require(\'' + entry + '\').buggyApi()))"'))
  .then((res) => JSON.parse(res.stdout))
}
