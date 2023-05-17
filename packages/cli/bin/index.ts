#!/usr/bin/env node
import * as commander from 'commander'
import type { Command } from 'commander/typings'
const { program } = commander

import {
  CreateCommad,
  GenerateCommand,
  CreateAction,
  GenerateAction,
} from '../src'

import { version } from '../package.json'

function load(program: Command) {
  new CreateCommad(new CreateAction()).load(program)

  new GenerateCommand(new GenerateAction()).load(program)
}

const main = () => {
  const p = program
    .version(version, '-v, --version', 'output the current version')
    .usage('mn-cli <command> [options]')
    .helpOption('-h, --help', 'output usage information')

  load(p)

  p.parse()
  // program.opts() 例如 -f

  // program.args 参数, -f 11， args: [11]
  // console.log(program.args, program.opts())
  if (!process.argv.slice(2).length) {
    program.outputHelp()
  }
}

main()
