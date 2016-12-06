/**
 * Gather tools necessary for transformations.
 */

import {join, relative} from 'path'
import extend from 'lodash/fp/extend'
import os from 'os'
import mkdirp from 'mkdirp-then'
import {exec} from 'child-process-promise'
import walk from 'walkdir'
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
  return mkdirp(cachePath())
  .then(() => true)
}

const toTool = (path) => {
  var splitted = path.split('/')
  if (splitted.length <= 1) {
    return null
  } else if (splitted[0][0] === '@' && splitted[2] && semver.valid(splitted[2])) {
    return {module: splitted[0] + '/' + splitted[1], version: splitted[2]}
  } else if (splitted[1] && semver.valid(splitted[1])) {
    return {module: splitted[0], version: splitted[1]}
  } else return null
}

export const listTools = () => {
  return init()
  .then(() => walk.sync(cachePath(), {max_depth: 3})
    .map((p) => relative(cachePath(), p))
    .map(toTool)
    .filter((t) => t))
}

export const dependencyPath = (dependency, version) =>
  (dependency && version) ? join(cachePath(), dependency, version) : ''

export const install = (tool, provider) => {
  return init()
  .then(() => isNPMDependency(tool.module))
  .then((isNPM) => {
    if (isNPM) {
      var depPath = dependencyPath(tool.module, tool.version)
      return provider.install(tool.module, tool.version, depPath)
    } else {
      throw new Error('Cannot install ' + tool.module + '@' + tool.version)
    }
  })
}

export const execute = (tool, input, provider) => {
  return run(tool, input, '$<bin> $<args>', provider)
}

export const run = (tool, input, execString, provider) => {
  return provider.cliInterface(tool.module, tool.version, dependencyPath(tool.module, tool.version))
  .then((bin) => {
    var args = []
    if (typeof (tool.args) === 'string') {
      args = tool.args
    } else if (Array.isArray(tool.args)) {
      args = tool.args.join(' ')
    }
    const execution = execString.replace('$<bin>', bin).replace('$<input>', input).replace('$<args>', args)
    var binExec = exec(((tool.noNode) ? '' : 'node ') + execution)
    setTimeout(() => { // does not work without this on my home pc
      if (execString.indexOf('$<input>') === -1 && !binExec.childProcess.stdin.destroyed) {
        binExec.childProcess.stdin.write(input)
      }
      binExec.childProcess.stdin.end()
    }, 10)
    return binExec
  })
  .then((result) => result.stdout.trim())
}

/* ### use API directly.. in the future... ###
const getPackageJson = (path) =>
  JSON.parse(fs.readFileSync(join(path, 'package.json')))

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
*/

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

/**
 * Get the cli interface for the tool.
 * @param {String} pkg Name of the package.
 * @param {String} version Semver version of the package. Use null for default package version.
 * @param {Provider} provider A source for the dependency information. This could be a npm-provider that
 *  looks into the npm-registry.
 * @returns {Promise<String>} The path to the CLI tool relative the to package.
 */
export const cliInterface = (pkg, version, provider) =>
  provider.cliInterface(pkg, version)

const atLeastSemver = (version, least) =>
  version == null || !least || semver.gte(version, least)

/**
 * Checks whether a version is a valid graphtools version or not. The graphtools API changed from
 * 0.3.0 to 0.4.0 significantly. Every graphtools dependency must at least support the 0.4.0 version.
 * @params {String} version A Semver string of the version to test.
 * @returns {boolean} True if the version is at least 0.4.0-pre.7, false otherwise.
 */
export const validGraphtoolsVersion = (version) =>
  atLeastSemver(version, '0.4.0-pre.7') // we currently want to match 0.4.0-pre.7 too

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
  .then((versions) => versions.filter((v) => atLeastSemver(v, tool.minVersion)))
  .then((versions) =>
    Promise.all(versions.map((version) => graphtoolDependency(tool.module, version, provider)
    .then((gtVersion) => extend(tool, {version, graphtools: gtVersion})))))
  .then((versions) => versions.filter((vs) => validGraphtoolsVersion(vs.graphtools)))

/**
 * Checks whether a tool satisfies the given graphtools version or not.
 * @param {Tool} tool A tools object, identifying the module.
 * @param {string} version A Semver version for the graphtools dependency.
 * @param {Provider} provider A provider for the dependency information. his could be a npm-provider that
 *   looks into the npm-registry.
 * @returns {Promise<bool>} True if the tool can work with the given graphtools version, false otherwise.
 */
export const satisfies = (tool, version, provider) => {
  if (tool.graphtools) {
    return Promise.resolve(atLeastSemver(tool.graphtools, version))
  } else {
    return graphtoolDependency(tool.module, tool.version, provider)
    .then((gtVersion) =>
      Promise.resolve(atLeastSemver(gtVersion, version)))
  }
}

export function inputs (toolchain) {
  return Object.keys(toolchain).map((k) => toolchain[k]).filter((tool) => tool.consumes.includes('input'))
}
