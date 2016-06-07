
import _ from 'lodash'

export const json = {
  name: 'json',
  description: 'JSON files in canonical form with no resolved nodes.'
}

export const resolved = {
  name: 'resolved',
  description: 'JSON representation of the graph. All compounds are either split into their inner nodes or are recursive compounds.'
}

export const interactive = {
  name: 'interactive',
  description: 'An interactive display of the graph in a browser.'
}

export const compiled = {
  name: 'code',
  parameter: 'language',
  description: 'Executable code in a programming language.'
}

export const targets = _.keyBy([json, resolved, interactive, compiled], 'name')
