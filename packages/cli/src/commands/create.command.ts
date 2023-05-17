import { Command } from 'commander'
import { AbstractCommand } from './abstract.command'

import { resolve } from 'path'
import { existsSync, remove } from 'fs-extra'
import * as inquirer from 'inquirer'

import { clearConsole } from '../utils'

export class CreateCommad extends AbstractCommand {
  load(program: Command): void {
    program
      .command('create [name]')
      .alias('c')
      .description('create a new project')
      .option('--directory [directory]', 'specify the directory')
      .action(async (source, args) => {
        console.log('command', source, args)

        const options = Object.keys(args).reduce((cur, next) => {
          const obj = {
            name: next,
            value: args[next],
          }
          cur.push(obj)
          return cur
        }, [] as { name: string; value: string }[])

        const targetDir = args['directory']
          ? args['directory']
          : resolve(process.cwd(), source || '.')

        if (existsSync(targetDir)) {
          clearConsole()
          const prompt = inquirer.createPromptModule()
          const { action } = await prompt([
            {
              name: 'action',
              type: 'list',
              message: `Target directory ${targetDir} already exists. Pick an action:`,
              choices: [
                { name: 'Overwrite', value: 'overwrite' },
                { name: 'Cancel', value: false },
              ],
            },
          ])

          if (!action) {
            return
          } else if (action === 'overwrite') {
            console.log(`Removeing ${targetDir}`)
            await remove(targetDir)
          }
        }

        this.action.handle(targetDir, options)
      })
  }
}
