export abstract class AbstractAction {
  abstract handle(ctx: string, options: { name: string; value: string }[]): Promise<any>
}
