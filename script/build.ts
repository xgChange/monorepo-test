// vite.config.js
import { resolve, basename, dirname } from 'path'
import { readdirSync } from 'fs'
import { build } from 'vite'
import { promisify } from 'util'
import { exec } from 'child_process'

const execa = promisify(exec)

const command = 'git diff --name-status'

const packagesPath = resolve(__dirname, '..', 'packages')

const allPackagesPath = readdirSync(packagesPath)

const packageNameReg = /^packages\/[a-zA-Z]+\/CHANGELOG\.md$/

let external = [] as string[]

function formatDiffList(stdout: string) {
  return stdout
    .split('\n')
    .filter((item) => item)
    .map((str) => str.split('\t'))
}

async function getGitDiffMsg() {
  const { stdout } = await execa(command)
  const list = formatDiffList(stdout)
  const listPath = list
    .map((item: any[]) => item[1])
    .filter((path) => packageNameReg.test(path))
    .map((item) => dirname(item).split('/')[1])
  return listPath.length ? listPath : undefined
}

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
    const diffMsgPath = await getGitDiffMsg()
    console.log('git diff msg', diffMsgPath)
    console.log('构建的包列表', diffMsgPath || allPackagesPath)
    await buildAll(diffMsgPath || allPackagesPath)
    console.log('构建成功')
  } catch (error) {
    console.log(error)
  }
}

run()
