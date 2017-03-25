
import library from '@buggyorg/library-cli/lib/commands/commands'
/*
import {run, graphToInputFormat} from '../api'
import * as Toolchain from '../toolchain'
import * as NPM from '../npm/cacheCli'
*/

function tryParse (str) {
  try {
    return Promise.resolve(JSON.parse(str))
  } catch (err) {
    return Promise.reject('Cannot parse input string:\n' + str)
  }
}

export const command = 'library'
export const description = 'Library functionalities'
export const builder = (yargs) => {
  // hacky-di-hack remove demand for t
  delete yargs.getDemandedOptions()['t']
  // add commands from library-client
  // var provider = NPM
  return library(yargs,
    // conversion [input] -> [portgraph] (e.g. lisgy input to portgraph)
    (contents) => tryParse(contents),
    // (contents) => run(contents, 'component', [], Toolchain, provider, {}),
    // TODO: conversion [portgraph] -> [input] (e.g. portgraph to lisgy)
    (graph) => Promise.resolve(graph))
    // (graph) => graphToInputFormat(graph, Toolchain, provider))
}

export const handler = (argv) => {
  global.wasCommand = true
}
