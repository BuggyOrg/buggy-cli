import { Graph } from 'graphlib'
import * as tools from './toolchain'

const toolchain = new Graph({ directed: true })
Object.keys(tools).forEach((name) => graph.setNode(name, tools[name]))
tools.forEach((nameA) => {
  const toolA = tools[nameA]
  graph.setNode(`${toolA.consumes} >`)
  graph.setNode(`> ${toolA.produces}`)

  tools.forEach((nameB) => {
    const toolB = tools[nameB]
    if (toolA.produces === toolB.consumes) {
      toolchain.setEdge(nameA, nameB)
    }
  })
})

export function getToolChain (from, to) {
  const startNode = toolchain.node(`${from} >`)
  const targetNode = toolchain.node(`> ${to}`)
  
  if (startNode == null || targetNode == null) {
    return null
  }

  const dijkstra = alg.dijkstra(toolchain, startNode)
  
}
