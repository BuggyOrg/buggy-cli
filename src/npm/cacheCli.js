/**
 * A provider for dependency and package information. This uses the NPM CLI to
 * query the npm-respository. It stores the results locally to increase speed.
 */


import * as cli from './cliCommands'
import cache from 'cache-function'
import {cachePath} from '../tools'

/**
 * Install a specific version of the an npm package.
 * @params {String} dependency The package name
 * @params {String} version The semver version to install
 * @params {String} path Where to install the dependency.
 * @returns {Promise} If the package was successfully installed the promise will resolve otherwise it will
 *   reject.
 */
export const install = cli.install

export const cliInterface = cache(cli.cliInterface, {tmpDir: cachePath()})

/**
 * Get the version of a dependency for a specific package. Returns null if it
 * is not dependent on the dependency.
 * @param {String} pkg Name of the package.
 * @param {String} version Semver version of the package. Use null for default package version.
 * @param {String} dependency The name of the depdendency to look for.
 * @returns {String} A Semver string specifying the version of the dependency. If
 * the package does not depend on the dependency it will return null.
 */
export const dependencyVersion = cache(cli.dependencyVersion, {tmpDir: cachePath()})

/**
 * Gets a list of versions for a package.
 * @param {String} pkg The package.
 * @returns {Array} An array of version strings (in Semver format).
 */
export const packageVersions = cache(cli.packageVersions, {tmpDir: cachePath()})
