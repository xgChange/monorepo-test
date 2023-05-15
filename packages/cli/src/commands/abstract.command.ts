import { Command } from 'commander'
import { AbstractAction } from '../action/abstract.action';

export abstract class AbstractCommand {
  constructor(protected action: AbstractAction) {}
  abstract load(program: Command): void
}