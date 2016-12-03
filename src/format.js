/**
 * formats the output
 */

import {exec} from 'child-process-promise'

export const fancyToolchain = (toolchain) => {
  return exec('which graph-easy')
  .then(() => {
    var easyGraphTxt = toolchain.map((tool) => '[' + tool.module + '\\n@' + tool.version + ']')
      .join(' --> ')
    var easyGraphProc = exec('graph-easy --from=txt --as=boxart')
    easyGraphProc.childProcess.stdin.write(easyGraphTxt)
    easyGraphProc.childProcess.stdin.end()
    return easyGraphProc
  })
  .then((result) => result.stdout.trim())
  .catch(() => {
    normalToolchain(toolchain)
  })
}

export const normalToolchain = (toolchain) => 'Install `graph-easy` to view the high quality output\n\n' + (toolchain)
