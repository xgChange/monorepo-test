const { copySync } = require('fs-extra')
const { resolve } = require('path')

copySync(resolve(__dirname, '../template'), resolve(__dirname, '../dist/tempate'))