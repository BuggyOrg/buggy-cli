/**
 * Gather tools necessary for transformations.
 */

import {join} from 'path'
import os from 'os'
import mkdirp from 'mkdirp-then'

const systemAppDir = () =>
  process.env.APPDATA ||
    (process.platform === 'darwin'
      ? join(os.homedir(), 'Library/Preferences')
      : join(os.homedir(), '/.local/share'))

const buggyLocal = process.env.BUGGY_LOCAL_PATH || systemAppDir

const isNPMDependency = (dep) => {
  return new Promise.resolve(true)
}

const buggyDir = join(buggyLocal, 'buggy', require('../package.json').version)

export const init = () => {
  return Promise.all([
    mkdirp(buggyDir),
    mkdirp(join(buggyDir, 'tools'))
  ])
}

export const listTools = () => {
  
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
