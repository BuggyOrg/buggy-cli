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
  var inputs = ToolAPI.inputs(tools)
  return Promise.all(inputs.map((tool) => checkInputTool(tool, input, provider)))
  .then((checks) => inputs.filter((_, n) => checks[n]))
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
