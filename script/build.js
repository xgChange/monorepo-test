// vite.config.js
const { resolve, basename, dirname } = require('path')
const minimist = require('minimist')
const { readdirSync, existsSync } = require('fs')
const { build } = require('vite')
const { promisify } = require('util')
const { exec } = require('child_process')
const esbuild = require('rollup-plugin-esbuild').default
const execa = promisify(exec)

const args = minimist(process.argv.slice(2))
const command = 'git diff --name-status HEAD~0 HEAD~1'

const packagesPath = resolve(__dirname, '..', 'packages')
const allPackagesPath = readdirSync(packagesPath)
const speTargets = args._.length ? args._ : allPackagesPath

const packageNameReg = /^packages\/[a-zA-Z]+\/CHANGELOG\.md$/

let externalArr = []

const buildCommandWhitelist = ['cli']

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

function getFormatOutput(flag, output, placeholder = []) {
  return flag ? output : placeholder
}

async function buildPackage(target) {
  const packageJson = getPackgeJson(target)

  if (buildCommandWhitelist.includes(target)) {
    return execa(`pnpm -C packages/${target} build`)
  }

  externalArr = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.peerDependencies || {}),
  ]

  const buildOption = packageJson.buildOption || {}

  const buildOptionName = buildOption.name

  const iifePackages = getFormatOutput(buildOptionName, [
    {
      format: 'iife',
      dir: resolve(packagesPath, target, 'dist'),
      name: buildOptionName,
      entryFileNames: basename(packageJson.browser || ''),
      globals: getGlobalExternals(externalArr),
    },
  ])

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
  let diffMsgPath = speTargets
  // if (buildCommandWhitelist.length) {
  //   const filterTargets = speTargets.filter((item) => {
  //     return !buildCommandWhitelist.includes(item)
  //   })
    
  // }
  console.log('git diff msg', diffMsgPath)
  console.log('构建的包列表', diffMsgPath)
  await buildAll(diffMsgPath || [])
  console.log('构建成功')
}

run()
