// vite.config.js
// import { resolve, basename, dirname } from 'path'
// import { readdirSync } from 'fs'
// import { build } from 'vite'
// import { promisify } from 'util'
// import { exec } from 'child_process'
const { resolve, basename, dirname } = require('path')
const { readdirSync } = require('fs')
const { remove } = require('fs-extra')
const { build } = require('vite')
const { promisify } = require('util')
const { exec } = require('child_process')
const esbuild = require('rollup-plugin-esbuild').default
const execa = promisify(exec)

const command = 'git diff --name-status HEAD~0 HEAD~1'

const packagesPath = resolve(__dirname, '..', 'packages')

const allPackagesPath = readdirSync(packagesPath)

const packageNameReg = /^packages\/[a-zA-Z]+\/CHANGELOG\.md$/

const buildCommandWhitelist = ['cli']

const buildCommandFn = async (packagename) => {
  return execa(`pnpm -C packages/${packagename} build`)
}

let externalArr = []

function formatDiffList(stdout) {
  return stdout
    .split('\n')
    .filter((item) => item)
    .map((str) => str.split('\t'))
}

async function getGitDiffMsg() {
  const { stdout } = await execa(command)
  const list = formatDiffList(stdout)
  const listPath = list
    .map((item) => item[1])
    .filter((path) => packageNameReg.test(path))
    .map((item) => dirname(item).split('/')[1])
  return listPath.length ? listPath : undefined
}

function getPackgeJson(target) {
  return require(resolve(packagesPath, target, 'package.json'))
}

// 下划线 转成 小驼峰
function formatNameToCamelCase(name) {
  return name.replace(/\-(\w)/g, function (_, letter) {
    return letter.toUpperCase()
  })
}

// 获取 externals 转换成 globals 配置
function getGlobalExternals(external) {
  return external.reduce((prev, curr) => {
    prev[curr] = formatNameToCamelCase(curr)
    return prev
  }, {})
}

async function buildPackage(target) {
  const packageJson = getPackgeJson(target)

  externalArr = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.peerDependencies || {}),
  ]

  const buildOption = packageJson.buildOption || {}

  const buildOptionName = buildOption.name

  const iifePackages = buildOptionName
    ? [
        {
          format: 'iife',
          dir: resolve(packagesPath, target, 'dist'),
          name: buildOptionName,
          entryFileNames: basename(packageJson.browser),
          globals: getGlobalExternals(externalArr),
        },
      ]
    : []

  return build({
    plugins: [
      {
        ...esbuild({
          tsconfig: resolve(__dirname, '..', 'tsconfig.lib.json'),
          minify: false,
        }),
        enforce: 'pre',
      },
    ],
    build: {
      lib: {
        entry: resolve(packagesPath, target, 'src/index.ts'),
      },
      rollupOptions: {
        external: externalArr,
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
          ...iifePackages,
        ],
      },
    },
  })
}

async function buildAll(allTarget) {
  await Promise.all(allTarget.map((item) => buildPackage(item)))
  const filterTargets = allTarget.filter((item) => {
    const packageJson = getPackgeJson(item)
    return packageJson.types
  })
  process.env.TARGETS = filterTargets.join(',')
  await execa('pnpm run build:type')
}

async function run() {
  try {
    // const diffMsgPath = await getGitDiffMsg()
    const diffMsgPath = allPackagesPath
    console.log('git diff msg', diffMsgPath)
    console.log('构建的包列表', diffMsgPath)
    await buildAll(diffMsgPath || [])
    console.log('构建成功')
  } catch (error) {
    console.log('错误', error.message)
  }
}

run()
