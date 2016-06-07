
import {resolve} from '@buggyorg/resolve'
import {resolveLambdaTypes} from '@buggyorg/functional'
import {replaceGenerics} from '@buggyorg/generics'
import {applyTypings} from '@buggyorg/typify'
import addContinuations from '@buggyorg/muxcontinuations'
import {normalize} from '@buggyorg/dupjoin'
import {remodelPorts} from '@buggyorg/npg-port-remodeler'
import gogen from '@buggyorg/gogen'
import _ from 'lodash'

export const jsonToResolved = {
  needs: 'json',
  creates: 'resolved',
  needsComponentLibrary: true,
  process: resolve
}

export const resolvedToLambdas = {
  needs: 'resolved',
  adds: 'lambdas',
  process: resolveLambdaTypes
}

export const resolvedToTyped = {
  needs: ['resolved', 'lambdas'],
  adds: 'typed',
  process: replaceGenerics
}

export const resolvedToRealTypes = {
  needs: ['resolved', 'lambdas', 'generics', 'language'],
  adds: 'languageTypes',
  process: _.partial(applyTypings, _, {number: 'int64', bool: 'bool', string: 'string'}) // create better types here!
}

export const resolvedToContinuations = {
  needs: 'resolved',
  adds: 'continuations',
  process: addContinuations
}

export const resolvedToNormalizedEdges = {
  needs: 'resolved',
  adds: 'normalization',
  process: normalize
}

export const resolvedToNG = {
  needs: 'resolved',
  creates: 'ng',
  process: remodelPorts
}

export const ngToPreproc = {
  needs: ['ng', 'language=go'],
  creates: 'preproc-ng',
  process: gogen.preprocess
}

export const preprocToCode = {
  needs: ['preproc-ng', 'language=go', 'lambdas', 'continuations', 'normalization', 'typed', 'languageTypes'],
  creates: 'code',
  process: gogen.generateCode
}

export const transformations = [jsonToResolved, resolvedToLambdas, resolvedToContinuations,
  resolvedToNormalizedEdges, resolvedToNG, resolvedToRealTypes, resolvedToTyped, resolveLambdaTypes,
  ngToPreproc, preprocToCode]
