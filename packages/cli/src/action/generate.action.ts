import { AbstractAction } from './abstract.action'

export class GenerateAction extends AbstractAction {
  handle(
    ctx: string,
    options: { name: string; value: string }[]
  ): Promise<any> {
    throw new Error('Method not implemented.')
  }
}
