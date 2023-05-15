import { cursorTo, clearScreenDown } from 'readline'

export const clearConsole = () => {
  const blank = '\n'.repeat(process.stdout.rows)
  console.log(blank)
  cursorTo(process.stdout, 0, 0)
  clearScreenDown(process.stdout)
}
