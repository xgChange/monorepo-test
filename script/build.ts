// vite.config.js
import { resolve, basename } from 'path'
import { readdirSync } from 'fs'
import { build } from 'vite'

const packagesPath = resolve(__dirname, '..', 'packages')

const allPackagesPath = readdirSync(packagesPath)

let external = [] as string[]

function getPackgeJson(target: string) {
  return require(resolve(packagesPath, target, 'package.json'))
}

async function buildPackage(target: string) {
  const packageJson = getPackgeJson(target)
  external = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.peerDependencies || {}),
  ]

  const buildOption = packageJson.buildOption || {}

  const buildOptionName = buildOption.name || packageJson.name
  return build({
    build: {
      lib: {
        entry: resolve(packagesPath, target, 'src/index.ts'),
      },
      rollupOptions: {
        external,
        output: [
          {
            format: 'cjs',
            entryFileNames: basename(packageJson.main),
            dir: resolve(packagesPath, target, 'dist'),
          },
          {
            format: 'es',
            dir: resolve(packagesPath, target, 'dist'),
            entryFileNames: basename(packageJson.module),
          },
          {
            format: 'iife',
            dir: resolve(packagesPath, target, 'dist'),
            name: buildOptionName,
            entryFileNames: basename(packageJson.browser),
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
  try {
    await buildAll(allPackagesPath)
    console.log('构建成功')
  } catch (error) {
    console.log(error)
  }
}

run()
