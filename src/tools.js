/**
 * Gather tools necessary for transformations.
 */

import {join} from 'path'
import os from 'os'
import mkdirp from 'mkdirp-then'
import {exec} from 'child-process-promise'
import fs from 'fs'
import semver from 'semver'

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

/**
 * Gets a list of versions for a package.
 * @param {String} pkg The package.
 * @param {Provider} provider A provider that is the source for the packages and theit meta information.
 *   This could be a npm-provider that looks into the npm-registry.
 * @returns {Promise<String[]>} An array of version strings (in Semver format).
 */
export const gatherVersions = (pkg, provider) =>
  provider.packageVersions(pkg)


/**
 * Get the graphtool dependency for a specific package. Returns null if it
 * is not dependent on graphtools.
 * @param {String} pkg Name of the package.
 * @param {String} version Semver version of the package. Use null for default package version.
 * @param {Provider} provider A source for the dependency information. This could be a npm-provider that
 *  looks into the npm-registry.
 * @returns {Promise<String>} A Semver string specifying the version of the graphtools dependency. If
 * the package does not depend on graphtools it will return null.
 */
export const graphtoolDependency = (pkg, version, provider) =>
  provider.dependencyVersion(pkg, version, '@buggyorg/graphtools')

const atLeastSemver = (version, least) => {
  return !least || semver.gte(version, least)
}

/**
 * Checks whether a version is a valid graphtools version or not. The graphtools API changed from
 * 0.3.0 to 0.4.0 significantly. Every graphtools dependency must at least support the 0.4.0 version.
 * @params {String} version A Semver string of the version to test.
 * @returns {boolean} True if the version is at least 0.4.0-pre.7, false otherwise.
 */
export const validGraphtoolsVersion = (version) => {
  return version === null || atLeastSemver(version, '0.4.0-pre.7') // we currently want to match 0.4.0-pre.7 too
}

/**
 * A tool is valid if it has no graphtools dependency, or if the graphtools
 * dependency is a valid graphtool dependency (if it is not working with the old)
 * graphtools implementation.
 * @param {Tool} tool A tools object containing the `module` name and optionally a `minVersion` field.
 * @param {Provider} provider A source for the package information. This could be a npm-provider that
 *   looks into the npm-registry.
 * @returns {Promise<Array>} A tool array of all valid version with added information for the graphtools dependency.
 */
export const validToolVersions = (tool, provider) =>
  gatherVersions(tool.module, provider)
  .then((versions) =>
    Promise.all(versions.map((version) => graphtoolDependency(tool.module, version, provider)
    .then((gtVersion) => ({tool, version, graphtools: gtVersion})))))
  .then((versions) => versions.filter((vs) => validGraphtoolsVersion(vs.graphtools)))
  .then((versions) => versions.filter((v) => atLeastSemver(v.version, tool.minVersion)))
