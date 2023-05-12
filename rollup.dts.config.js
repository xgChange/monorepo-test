const dts = require('rollup-plugin-dts').default
const { readdirSync } = require('fs')

const packages = readdirSync('temp/packages')
const targets = process.env.TARGETS ? process.env.TARGETS.split(',') : []

const targetPackages = targets
  ? packages.filter((pkg) => targets.includes(pkg))
  : packages

module.exports = targetPackages.map((pkg) => ({
  input: `./temp/packages/${pkg}/src/index.d.ts`,
  output: {
    file: `packages/${pkg}/dist/${pkg}.d.ts`,
    format: 'es',
  },
  plugins: [dts()],
}))
