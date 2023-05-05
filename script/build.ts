// vite.config.js
import { resolve, basename } from 'path'
import { readdirSync } from 'fs'
import { build } from 'vite'

const packagesPath = resolve(__dirname, '..', 'packages')

const allPackagesPath = readdirSync(packagesPath)

function getPackgeJson(target: string) {
  return require(resolve(packagesPath, target, 'package.json'))
}

async function buildPackage(target: string) {
  const packageJson = getPackgeJson(target)
  return build({
    build: {
      lib: {
        entry: resolve(packagesPath, target, 'src/index.ts'),
      },
      rollupOptions: {
        output: [
          {
            format: 'cjs',
            entryFileNames: basename(packageJson.main),
            dir: resolve(packagesPath, target, 'dist'),
          },
          {
            format: 'esm',
            dir: resolve(packagesPath, target, 'dist'),
            entryFileNames: basename(packageJson.module)
          },
          {
            format: 'umd',
            dir: resolve(packagesPath, target, 'dist'),
            name: packageJson.name,
            entryFileNames: basename(packageJson.browser)
          },
        ],
      },
    },
  })
}

async function buildAll(allTarget: string[]) {
  return Promise.all(allTarget.map((item) => buildPackage(item)))
}

async function run() {
  // await buildAll(allPackagesPath)
  await buildAll([allPackagesPath[1]])
  console.log('构建成功')
}

run()
