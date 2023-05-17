import { Command } from 'commander'
import { AbstractCommand } from './abstract.command'

export class GenerateCommand extends AbstractCommand {
  load(program: Command): void {
    program
      .command('generate [packageName]')
      .alias('g')
      .description('generate a new package')
      .action(async (source, args) => {
        console.log('generate');
      })
  }
}
