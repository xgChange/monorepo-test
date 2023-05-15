

import { AbstractAction } from './abstract.action'

export class CreateAction extends AbstractAction {
  async handle(ctx: string, options: { name: string; value: string }[]) {
    console.log('handle', ctx, options)
  }
}
