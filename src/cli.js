#!/usr/bin/env node
/* global __dirname, process */

import * as Toolchain from './toolchain'
import * as npm from './npm/cliCommands'
import {pinpointSequenceVersions} from './api'

/*
gatherVersions('@buggyorg/graphtools')
  .then((versions) => versions.filter(validGraphtoolsVersion))
  .then((versions) => console.log(versions))
  .catch((err) => console.error(err))
*/

/*
validToolVersions(Toolchain.lisgy)
.then((versions) => console.log(versions))
*/

pinpointSequenceVersions([Toolchain.lisgy, Toolchain.portgraph2kgraph, Toolchain.graphify], npm)
.then((res) => console.log(res))
.catch((err) => console.error(err))
