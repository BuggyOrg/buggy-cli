import * as ToolAPI from './tools'
import flatten from 'lodash/fp/flatten'
import uniq from 'lodash/fp/uniq'
import {calculateToolchain, calculateToolchainFromInput} from './toolchainGen'
import {compare} from 'semver'
import promiseSequence from 'promise-sequential'

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
  if (tool.command) return Promise.resolve(tool)
  return ToolAPI.validToolVersions(tool, provider)
  .then((tools) => tools.reverse().find((tool) => ToolAPI.satisfies(tool, basicVersion, provider)))
  .then((valid) => {
    if (!valid) throw new Error('Could not find a valid version for tool ' + tool.module)
    else return valid
  })
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
  .then((toolchain) => promiseSequence(toolchain.map((tool) => () => ToolAPI.install(tool, provider)))
    .then(() => toolchain))
}

export async function runToolchain (toolchain, input, provider, { onStartTool, onFinishTool } = {}) {
  let output = input

  for (const tool of toolchain) {
    if (onStartTool != null) onStartTool(tool)
    try {
      output = await ToolAPI.execute(tool, output, provider)
      if (onFinishTool != null) onFinishTool(null, tool)
    } catch (err) {
      if (onFinishTool != null) onFinishTool(err, tool)
      throw err
    }
  }

  return output
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
  return createSequence(tools[input], output, args, tools, provider)
  .then((sequence) => prepareToolchain(sequence, provider))
}

export function toolchainSequenceFromInput (input, output, args, tools, provider) {
  return createSequenceFromInput(input, output, args, tools, provider)
  .then((sequence) => prepareToolchain(sequence, provider))
}

export async function run (input, output, args, tools, provider, { onStartTool, onFinishTool, onStartBuildToolChain, onFinishBuildToolchain }) {
  if (onStartBuildToolChain != null) onStartBuildToolChain()
  const sequence = await toolchainSequenceFromInput(input, output, args, tools, provider)
  if (onFinishBuildToolchain != null) onFinishBuildToolchain(sequence)
  return await runToolchain(sequence, input, provider, { onStartTool, onFinishTool })
}

export function graphToInputFormat (graph, tools, provider) {
  return ToolAPI.inputs(tools, provider)
  .then((inputs) => {
    var validTool = inputs.filter((input) =>
      typeof (graph.metaInformation[input.name]) === 'string')[0]
    if (validTool) return graph.metaInformation[validTool.name]
    else return graph
  })
}
