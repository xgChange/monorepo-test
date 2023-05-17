const { copySync, removeSync } = require('fs-extra')
const { resolve } = require('path')

copySync(resolve(__dirname, '../dist/packages/cli'), resolve(__dirname, '../dist'))
copySync(resolve(__dirname, '../template'), resolve(__dirname, '../dist/template'))
removeSync(resolve(__dirname, '../dist/packages'))