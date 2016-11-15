/**
 * Gather tools necessary for transformations.
 */

import {join} from 'path'
import os from 'os'
import mkdirp from 'mkdirp-then'
import {exec} from 'child-process-promise'

const systemAppDir = () =>
  process.env.APPDATA ||
    (process.platform === 'darwin'
      ? join(os.homedir(), 'Library/Preferences')
      : join(os.homedir(), '/.local/share'))

const buggyLocal = () => process.env.BUGGY_LOCAL_PATH || systemAppDir()
const buggyDir = () => join(buggyLocal(), 'buggy', require('../package.json').version)

const isNPMDependency = (dep) => {
  return new Promise.resolve(true)
}


export const init = () => {
  return Promise.all([
    mkdirp(buggyDir),
    mkdirp(join(buggyDir, 'tools'))
  ])
}

export const listTools = () => {
  
}

const installNPM = (dependency) => {
  return exec('npm i', {options: {cwd: }})
}

export const install = (dependency) => {
  return isNPMDependency(dependency)
  .then((isNPM) => {
    if (isNPM) {
      return installNPM(dependency)
    } else {
      throw new Error('Cannot install ' + dependency)
    })
}
