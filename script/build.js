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
const typescriptPlugin = require('rollup-plugin-typescript2')
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
        },
      ]
    : []
  return build({
    plugins: [
      {
        ...typescriptPlugin({
          check: true,
          tsconfig: resolve(__dirname, '../tsconfig.lib.json'),
          tsconfigOverride: {
            compilerOptions: {
              declaration: true,
              emitDeclarationOnly: true,
            },
          },
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
  }).then(async () => {
    if (packageJson.types) {
      console.log(`Rolling up type definitions for ${target}...`)

      // build types
      const { Extractor, ExtractorConfig } = require('@microsoft/api-extractor')

      const extractorConfigPath = resolve(
        packagesPath,
        target,
        `api-extractor.json`
      )
      const extractorConfig =
        ExtractorConfig.loadFileAndPrepare(extractorConfigPath)
      const extractorResult = Extractor.invoke(extractorConfig, {
        localBuild: true,
        showVerboseMessages: true,
      })

      if (extractorResult.succeeded) {
        console.log('create types successed')
      }
      console.log(`${resolve(packagesPath, target)}/dist/packages`)
      return remove(`${resolve(packagesPath, target)}/dist/packages`)
    }
  })
}

async function buildAll(allTarget) {
  return Promise.all(allTarget.map((item) => buildPackage(item)))
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
