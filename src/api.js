import { Graph } from 'graphlib'
import * as Tools from './toolchain'
import * as ToolAPI from './tools'
import flatten from 'lodash/fp/flatten'
import uniq from 'lodash/fp/uniq'
import {compare} from 'semver'

function createToolchain (tools) {
  const toolchain = new Graph({ directed: true })
  Object.keys(tools).forEach((name) => toolchain.setNode(name, tools[name]))
  tools.forEach((nameA) => {
    const toolA = tools[nameA]
    toolchain.setNode(`${toolA.consumes} >`)
    toolchain.setNode(`> ${toolA.produces}`)

    tools.forEach((nameB) => {
      const toolB = tools[nameB]
      if (toolA.produces === toolB.consumes) {
        toolchain.setEdge(nameA, nameB)
      }
    })
  })
  return toolchain
}

export function getToolSequence (from, to, tools = Tools) {
  const toolchain = createToolchain(tools)
  const startNode = toolchain.node(`${from} >`)
  const targetNode = toolchain.node(`> ${to}`)

  if (startNode == null || targetNode == null) {
    return null
  }

  const dijkstra = alg.dijkstra(toolchain, startNode)
  
}

export function allValidVersions (sequence, provider) {
  return Promise.all(sequence.map((tool) => ToolAPI.validToolVersions(tool, provider)))
  .then((sequence) =>
    uniq(
      flatten(sequence).map((tool) => tool.graphtools)
      .filter((v) => v !== null)
      .sort(compare))
  )
}

export function pinpointSequenceVersions (sequence) {
  return Promise.all(sequence.map(ToolAPI.validToolVersions))
  .then((sequence) =>
    uniq(
      flatten(sequence).map((tool) => tool.graphtools)
      .filter((v) => v !== null)
      .sort(compare))
  )
}
