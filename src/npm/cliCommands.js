/**
 * A provider for dependency and package information. This uses the NPM CLI to
 * query the npm-respository.
 */

import {exec} from 'child-process-promise'
import merge from 'lodash/fp/merge'
import mkdirp from 'mkdirp-then'
import {join} from 'path'

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
export async function install (dependency, version, path) {
  var opts = { cwd: path, env: merge(process.env, {NODE_ENV: 'production'}) }
  await mkdirp(path)
  const res = await exec(`npm pack ${dependency}@${version} -q`, opts)
  const tar = res.stdout.trim()
  await exec('tar -xzf ' + tar + ' --strip-components=1 package', opts)
  await Promise.all([exec('rm ' + tar, opts), exec('npm i', opts)])
}

export async function cliInterface (pkg, version, path) {
  const res = await exec('npm view ' + pkg + ((version) ? ('@' + version) : '') + ' bin --json')
  const bins = JSON.parse(res.stdout)
  return join(path, bins[Object.keys(bins)[0]]) // rather ugly.. there is no inherent order in an object... so this could be random
}

/**
 * Get the version of a dependency for a specific package. Returns null if it
 * is not dependent on the dependency.
 * @param {String} pkg Name of the package.
 * @param {String} version Semver version of the package. Use null for default package version.
 * @param {String} dependency The name of the depdendency to look for.
 * @returns {String} A Semver string specifying the version of the dependency. If
 * the package does not depend on the dependency it will return null.
 */
export async function dependencyVersion (pkg, pkgVersion, dependency) {
  const { stdout } = await exec('npm view ' + pkg + ((pkgVersion) ? ('@' + pkgVersion) : '') + ' dependencies.' + dependency + ' --json')
  if (/undefined/.test(stdout) || stdout.length < 2) return null
  return deRange(stdout.slice(1, -2))
}

/**
 * Gets a list of versions for a package.
 * @param {String} pkg The package.
 * @returns {Array} An array of version strings (in Semver format).
 */
export async function packageVersions (pkg) {
  const versions = await exec('npm view ' + pkg + ' versions --json')
  return JSON.parse(versions.stdout)
}
