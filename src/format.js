/**
 * formats the output
 */

import {render} from 'terminal-graphs'

const betweenPairs = (callback, sequence) => {
  return sequence.reduce((acc, cur) => {
    if (acc[0] == null) return [cur, acc[1]]
    else {
      var prev = acc[0]
      return [cur, acc[1].concat(callback(prev, cur))]
    }
  }, [null, []])[1]
}

export const fancyToolchain = (toolchain) => {
  var children = toolchain.map((tool) => ({id: tool.module, labels: [{text: tool.module + '\n' + tool.version}]}))
  var edges = betweenPairs((a, b) => ({id: a.module + b.module, source: a.module, target: b.module}), toolchain)
  return render({children, edges, labels: [{text: ''}]})
}

export const normalToolchain = (toolchain) => 'Install `graph-easy` to view the high quality output\n\n' + (toolchain)

export const tool = (t) => {
  return JSON.stringify(t, null, 2)
}

export const tools = (ts) => {
  return ts.map(tool).join('\n\n')
}
