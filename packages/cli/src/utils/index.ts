import { resolve, dirname } from 'path'
import { cursorTo, clearScreenDown } from 'readline'
import {
  ensureDirSync,
  writeFileSync,
  createWriteStream,
  createReadStream,
} from 'fs-extra'

export const clearConsole = () => {
  const blank = '\n'.repeat(process.stdout.rows)
  console.log(blank)
  cursorTo(process.stdout, 0, 0)
  clearScreenDown(process.stdout)
}

export const writeFileTree = (dir: string, files: Record<string, any>) => {
  Object.keys(files).forEach((name) => {
    const filePath = resolve(dir, name)
    ensureDirSync(dirname(filePath))
    writeFileSync(filePath, files[name])
  })
}

export const readAndWriteByStream = (from: string, to: string) => {
  return new Promise<void>((resolve, reject) => {
    createReadStream(from)
      .pipe(
        createWriteStream(to).addListener('finish', () => {
          resolve()
        })
      )
      .addListener('error', (e) => {
        reject(e)
      })
  })
}

export const invokeFns = async (fns: any[]) => {
  const result: any[] = []
  for (const fn of fns) {
    const reuslt = await fn()
    result.push(reuslt)
  }

  return result
}

export const generateSubIndex = (pkgname: string) => {
  return `
   export const main = () => {
    console.log('hello', '${pkgname}')
   }
  `
}

export const generateSubTsConfig = () => {
  const str = `
  {
    "extends": "../../tsconfig.lib.json",
    "compilerOptions": {
      "declaration": true,
      "emitDeclarationOnly": false,
      "esModuleInterop": true,
      "target": "ES6",
      "module": "commonjs",
      "outDir": "./dist",
      "baseUrl": ".",
      "rootDir": "."
    },
    "ts-node": {
      "esm": true
    },
    "include": ["./bin", "./src/"],
    "exclude": ["**/dist", "**/tests", "node_modules/", "script/"]
  }
  `
  return str
}

