/**
 * A provider for dependency and package information. This uses the NPM CLI to
 * query the npm-respository.
 */

import {exec} from 'child-process-promise'
import merge from 'lodash/fp/merge'
import mkdirp from 'mkdirp-then'

const deRange = (versionRange) => {
  var prefix = versionRange[0]
  if (prefix === '~' || prefix === '^') return versionRange.slice(1)
  return versionRange
}

/**
 * Install a specific version of the an npm package.
 * @params {String} dependency The package name
 * @params {String} version The semver version to install
 * @params {String} path Where to install the dependency.
 * @returns {Promise} If the package was successfully installed the promise will resolve otherwise it will
 *   reject.
 */
export const install = (dependency, version, path) => {
  return mkdirp(path)
  .then(() => exec('npm i ' + dependency, {cwd: path, env: merge(process.env, {NODE_ENV: 'production'})}))
}

export const cliInterface = (pkg, version) =>
  exec('npm view ' + pkg + ((version) ? ('@' + version) : '') + ' bin --json')
  .then((bins) => bins[Object.keys(bins)[0]]) // rather ugly.. there is no inherent order in an object... so this could be random

/**
 * Get the version of a dependency for a specific package. Returns null if it
 * is not dependent on the dependency.
 * @param {String} pkg Name of the package.
 * @param {String} version Semver version of the package. Use null for default package version.
 * @param {String} dependency The name of the depdendency to look for.
 * @returns {String} A Semver string specifying the version of the dependency. If
 * the package does not depend on the dependency it will return null.
 */
export const dependencyVersion = (pkg, pkgVersion, dependency) =>
  exec('npm view ' + pkg + ((pkgVersion) ? ('@' + pkgVersion) : '') + ' dependencies.' + dependency + ' --json')
  .then((dependency) => {
    if (/undefined/.test(dependency.stdout) || dependency.stdout.length < 2) return null
    return deRange(dependency.stdout.slice(1, -2))
  })

/**
 * Gets a list of versions for a package.
 * @param {String} pkg The package.
 * @returns {Array} An array of version strings (in Semver format).
 */
export const packageVersions = (pkg) =>
  exec('npm view ' + pkg + ' versions --json')
  .then((versions) => JSON.parse(versions.stdout))
