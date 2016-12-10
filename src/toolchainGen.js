/**
 * Toolchain generation utility functions.
 * This file contains the necessary functionality to calculate the toolchain sequence for a given input -> output relation.
 * The algorithm works in 3 steps.
 *
 *  1) Determine input tool (via matchingInputTools)
 *     Find all the tools that are valid input processors.
 *  2) Determine dependencies to produce the output (via outputDependencies)
 *     This gives a list of tools that are required to create the output.
 *  3) Connect input and output tools (via connectTools)
 *     Some transformations have no semantic purpose. Those transformations are collected
 *     in the last step to create a processable sequence (i.e. every output type of a tool is
 *     the input type of the subsequent process)
 */

import * as Toolchain from './toolchain'
import * as ToolAPI from './tools'
import { Graph, alg } from 'graphlib'
import flatten from 'lodash/fp/flatten'
import merge from 'lodash/fp/merge'

// function

function checkActivation (tool, input, provider) {
  return (activation) => {
    if (typeof (activation) === 'function') return Promise.resolve(activation(input))
    else {
      return ToolAPI.run(tool, input, activation, provider)
      .then(() => true)
      .catch(() => false)
    }
  }
}

function checkInputToolArray (tool, activations, input, provider) {
  return Promise.all(activations.map(checkActivation(tool, input, provider)))
  .then((checks) => checks.every((x) => x))
}

function checkInputTool (tool, input, provider) {
  if (!tool.activatedBy) return false // each input must be activated
  if (!Array.isArray(tool.activatedBy)) {
    return checkInputToolArray(tool, [tool.activatedBy], input, provider)
  }
  return checkInputToolArray(tool, tool.activatedBy, input, provider)
}

/**
 * Gathers matching input tools for a given input and a toolchain.
 * @params {String} input An input that is being used to determine valid tools.
 * @params {Toolchain} tools A toolchain to search through.
 * @params {Provider} provider A provider that can install / execute tools.
 * @returns {Array<Tools>} An array of tools that are valid input processors for the given input.
 */
export function matchingInputTools (input, tools = Toolchain, provider) {
  return ToolAPI.inputs(tools, provider)
  .then((inputs) =>
    Promise.all(inputs.map((tool) => checkInputTool(tool, input, provider)))
    .then((checks) => { debugger; return inputs.filter((_, n) => checks[n]) }))
  .then((tools) => {
    if (tools.length === 0) throw new Error('No input tools available for given input.')
    else return tools
  })
}

function dependencyGraph (graph, outputs, tools, provider) {
  var deps = flatten(outputs
    .map((o) => (o.depends || []).map((d) => ({from: o.name, to: tools[d]}))))
  if (deps.length === 0) return graph
  var newDeps = deps.filter((d) => !graph.node(d.to.name)) // not yet existing deps
  deps.forEach((dep) => graph.setNode(dep.to.name, dep.to))
  deps.forEach((dep) => graph.setEdge(dep.from, dep.to.name))
  return dependencyGraph(graph, newDeps.map((d) => d.to), tools, provider)
}

function checkCycles (graph) {
  var cycles = alg.findCycles(graph)
  if (cycles.length > 0) {
    throw new Error('Found cycles in the dependency graph: \n' + JSON.stringify(cycles))
  }
}

export function outputDependencies (output, tools = Toolchain, provider) {
  var graph = new Graph({ directed: true })
  graph.setNode(output.name, output)
  var depGraph = dependencyGraph(graph, [output], tools, provider)
  checkCycles(depGraph)
  return alg.topsort(depGraph).reverse()
}

const betweenPairs = (callback, sequence) => {
  return sequence.reduce((acc, cur) => {
    if (acc.length === 0) return [cur]
    else {
      var prev = acc[acc.length - 1]
      return acc.concat(callback(prev, cur), [cur])
    }
  }, [])
}

function createToolchainGraph (tools) {
  const toolchain = new Graph({ directed: true })
  Object.keys(tools).forEach((name) => toolchain.setNode(name, tools[name]))
  Object.keys(tools).forEach((nameA) => {
    const toolA = tools[nameA]

    Object.keys(tools).forEach((nameB) => {
      const toolB = tools[nameB]
      if (toolA.produces === toolB.consumes) {
        toolchain.setEdge(nameA, nameB)
      }
    })
  })
  return toolchain
}

export function toolSequence (from, to, toolGraph) {
  const paths = alg.dijkstra(toolGraph, from)
  var path = []
  var cur = to
  while (cur && cur !== from) {
    path.push(cur)
    cur = paths[cur].predecessor
  }
  if (!cur) {
    throw new Error('No transformation possible from ' + from + ' to ' + to)
  }
  return path.reverse().slice(0, -1)
}

/**
 * Creates a processable sequence of tools in which each output of a tool
 * fits the input of the next tool.
 * @param {Array<Tool>} sequence A tool sequence that is not yet processable.
 * @param {Toolchain} tools A toolchain to resolve missing transformation tools.
 * @returns {Array<Tool>} A valid tool sequence that can be processed to create an output.
 */
export function connectTools (sequence, tools, provider) {
  var graph = createToolchainGraph(tools)
  var newTools = betweenPairs((prev, cur) => toolSequence(prev, cur, graph), sequence)
  return newTools.slice(0, -1)
}

export function calculateToolchainFromInput (input, output, tools, provider) {
  return matchingInputTools(input, tools, provider)
  .then((inputs) => calculateToolchain(inputs[0], output, tools, provider))
}

export function calculateToolchain (input, output, tools, provider) {
  return Promise.resolve(input)
  .then((input) => [input].concat(outputDependencies(output, tools, provider)))
  .then((sequence) => connectTools(sequence, merge(tools, {output: output}), provider))
}
