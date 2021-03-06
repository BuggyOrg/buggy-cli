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
import uniq from 'lodash/fp/uniq'
import contains from 'lodash/fp/contains'

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
    .then((checks) => inputs.filter((_, n) => checks[n])))
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

export function outputDependencies (outputs, tools = Toolchain, provider) {
  if (!Array.isArray(outputs)) return sequenceDependencies([outputs], tools, provider)
}

export function sequenceDependencies (sequence, tools = Toolchain, provider) {
  var graph = new Graph({ directed: true })
  var depGraph = dependencyGraph(graph, sequence, tools, provider)
  sequence.forEach((tool) => depGraph.setNode(tool.name, tool))
  // simplify this shit... every dependency must be in the graph,
  // but it also must take the sequence into account. Therefore add a
  // edge for each dependency and from the predecessor add an edge from the
  // depdency to the predecessor. Except when the dependency is the predecessor...
  betweenPairs((from, to) => depGraph.setEdge(to.name, from.name) &&
    (to.depends || []).forEach((dep) => {
      depGraph.setNode(dep, tools[dep])
      depGraph.setEdge(to.name, dep)
      if (from.name !== dep && from.produces === tools[dep].consumes && !contains(dep, from.depends)) {
        depGraph.setEdge(dep, from.name)
        // apply this for all the dependencies of the dependencies.. should probalby be recursive here...
        ;(tools[dep].depends || []).forEach((d) => {
          if (from.name !== d && from.produces === tools[d].consumes && !contains(d, from.depends)) {
            depGraph.setEdge(d, from.name)
          }
        })
      }
    }), sequence)
  checkCycles(depGraph)
  return alg.topsort(depGraph).reverse().map((t) => tools[t])
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

function adoptDependencies (dependencies, prev, tools) {
  return (tool) => {
    return merge(tool, {depends: uniq((tool.depends || [])
      .concat(dependencies.filter((dep) => tools[dep].produces === tool.consumes))
      .concat([prev.name]))})
  }
}

export function toolSequence (from, to, toolGraph, tools) {
  const paths = alg.dijkstra(toolGraph, from.name)
  var path = []
  var cur = to.name
  while (cur && cur !== from.name) {
    path.push(cur)
    cur = paths[cur].predecessor
  }
  if (!cur) {
    throw new Error('No transformation possible from ' + from.name + ' to ' + to.name)
  }
  return path.reverse().slice(0, -1)
}

function toTools (tools) {
  return (tool) => {
    if (typeof tool === 'string') return tools[tool]
    return tool
  }
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
  var newTools = betweenPairs((prev, cur) => toolSequence(prev, cur, graph, tools)
    .map(toTools(tools))
    .map(adoptDependencies(cur.depends || [], prev, tools)), sequence)
  return newTools
}

export function calculateToolchainFromInput (input, output, tools, provider) {
  return matchingInputTools(input, tools, provider)
  .then((inputs) => calculateToolchain(inputs[0], output, tools, provider))
}

export function calculateToolchain (input, output, tools, provider) {
  return Promise.resolve(input)
  .then((input) => [input, output])
  .then((sequence) => connectTools(sequence, merge(tools, {output: output}), provider))
  .then((sequence) => sequenceDependencies(sequence, tools, provider))
  .then((sequence) => sequence.slice(0, -1))
}
