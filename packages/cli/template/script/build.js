const { resolve } = require('path')
const minimist = require('minimist')
const { readdirSync } = require('fs')
const { promisify } = require('util')
const { exec } = require('child_process')
const execa = promisify(exec)

const args = minimist(process.argv.slice(2))

const packagesPath = resolve(__dirname, '..', 'packages')
const allPackagesPath = readdirSync(packagesPath)
const speTargets = args._.length ? args._ : allPackagesPath

async function buildPackage(target) {
  return execa(`pnpm -C packages/${target} build`)
}

async function buildAll(allTarget) {
  await Promise.all(allTarget.map((item) => buildPackage(item)))
}

async function run() {
  try {
    console.log('构建的包列表', speTargets)
    await buildAll(speTargets || [])
    console.log('构建成功')
  } catch (error) {
    console.log(error)
  }
}

run()
