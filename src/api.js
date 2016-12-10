
import * as ToolAPI from './tools'
import flatten from 'lodash/fp/flatten'
import uniq from 'lodash/fp/uniq'
import {calculateToolchain, calculateToolchainFromInput} from './toolchainGen'
import {compare} from 'semver'

export function allValidVersions (sequence, provider) {
  return Promise.all(sequence.map((tool) => ToolAPI.validToolVersions(tool, provider)))
  .then((sequence) =>
    uniq(
      flatten(sequence).map((tool) => tool.graphtools)
      .filter((v) => v !== null)
      .sort((a, b) => compare(b, a))) // sort descending
  )
}

function firstValid (tool, basicVersion, provider) {
  return ToolAPI.validToolVersions(tool, provider)
  .then((tools) => tools.reverse().find((tool) => ToolAPI.satisfies(tool, basicVersion, provider)))
}

function checkVersion (sequence, version, provider) {
  return Promise.all(sequence.map((tool) => ToolAPI.satisfies(tool, version, provider)))
  .then((sats) => sats.every((s) => s)) // Check if all tools satisfy the graphtools version.
}

function checkVersions (sequence, versions, provider) {
  return checkVersion(sequence, versions[0], provider)
  .then((valid) => {
    if (valid) return versions[0]
    else if (versions.length > 1) return checkVersions(sequence, versions.slice(1), provider)
    else return null
  })
}

export function pinpointSequenceVersions (sequence, provider) {
  return allValidVersions(sequence, provider)
  .then((versions) => checkVersions(sequence, versions, provider))
}

export function prepareToolchain (sequence, provider) {
  return pinpointSequenceVersions(sequence, provider)
  .then((version) => Promise.all(sequence.map((tool) => firstValid(tool, version, provider))))
  .then((toolchain) => Promise.all(toolchain.map((tool) => ToolAPI.install(tool, provider)))
    .then(() => toolchain))
}

export function runToolChain (toolchain, data, provider) {
  if (toolchain.length === 0) return Promise.resolve(data)
  return ToolAPI.execute(toolchain[0], data, provider)
  .then((res) => runToolChain(toolchain.slice(1), res, provider))
}

export function createSequenceFromInput (input, output, args, tools, provider) {
  const outputTarget = {
    name: 'output',
    depends: args,
    produces: 'artifact',
    consumes: output
  }
  return calculateToolchainFromInput(input, outputTarget, tools, provider)
}

export function createSequence (input, output, args, tools, provider) {
  const outputTarget = {
    name: 'output',
    depends: args,
    produces: 'artifact',
    consumes: output
  }
  return calculateToolchain(input, outputTarget, tools, provider)
}

export function toolchainSequence (input, output, args, tools, provider) {
  return createSequence(input, output, args, tools, provider)
  .then((sequence) => prepareToolchain(sequence, provider))
}

export function toolchainSequenceFromInput (input, output, args, tools, provider) {
  return createSequenceFromInput(input, output, args, tools, provider)
  .then((sequence) => prepareToolchain(sequence, provider))
}

export function run (input, output, args, tools, provider) {
  return toolchainSequenceFromInput(input, output, args, tools, provider)
  .then((sequence) => runToolChain(sequence, input, provider))
}
