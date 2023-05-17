import { existsSync } from 'fs'
import * as execa from 'execa'
import { join, basename } from 'path'
import { AbstractAction } from './abstract.action'
import readPkg from 'read-pkg'
import { copy, readFileSync, writeFile, mkdir, remove } from 'fs-extra'
import { writeFileTree, invokeFns, generateSubTsConfig, generateSubIndex } from '../utils'
import { callWithErrorAsyncHandling } from 'mn-toolset'
import * as inquirer from 'inquirer'

import { render } from 'ejs'

export class CreateAction extends AbstractAction {
  templatePath = join(__dirname, '../../template')

  collectFsOperation: any[] = []

  prompt = inquirer.createPromptModule()

  prefixPkgName = ''

  async handle(ctx: string, options: { name: string; value: string }[]) {
    console.log('handle', ctx, options)
    const prjName = basename(ctx)

    await this.copyTemplate(ctx)

    // 询问创建哪些 package
    await this.askCreatePackage(ctx)

    await this.handlePkgJson(prjName, ctx)

    await this.generateChangeset(ctx)

    // 执行 收集的 promise Fn，后面考虑加入一些 console.log 美化提示
    await callWithErrorAsyncHandling(
      () => {
        console.info('creating project .....')
        invokeFns(this.collectFsOperation)
      },
      {
        errorHandling: (e) => {
          console.error(e)
          remove(ctx)
        },
        successedHandling() {
          console.log('created successfully !!!');
        }
      },
    )
  }

  async generateChangeset(ctx: string) {
    this.collectFsOperation.push(async () => {
      execa.sync('pnpm', ['changeset', 'init'], {
        cwd: ctx,
        stdio: 'inherit'
      })
    })
  }

  async askCreatePackage(ctx: string) {
    const { packageName } = await this.prompt([
      {
        name: 'packageName',
        type: 'input',
        message: 'please enter at least one package name, separated by space',
      },
    ])

    this.collectFsOperation.push(async () =>
      this.createSubPackage(ctx, packageName.split(' '))
    )
  }

  async createSubPackage(ctx: string, name: string[]) {
    const generatePkg = async (pkgname: string) => {
      const basePkg = {
        name: `${this.prefixPkgName}-${pkgname}`,
        version: '0.1.0',
        scripts: {
          build: "tsc --project ./tsconfig.json",
        },
      }
      const indexTs = generateSubIndex(pkgname)
      await mkdir(join(ctx, 'packages', pkgname), { recursive: true })
      writeFileTree(join(ctx, 'packages', pkgname), {
        'package.json': JSON.stringify(basePkg, null, 2),
        'src/index.ts': indexTs,
        'tsconfig.json': generateSubTsConfig(),
      })
    }

    for (const pkgname of name) {
      await generatePkg(pkgname)
    }
  }

  async copyTemplate(ctx: string) {
    // 询问 包 的 prefix
    const result = await this.prompt([
      {
        name: 'prefixName',
        type: 'input',
        message: `please input package prefix name`,
      },
    ])
    const tsconfigJson = render(
      readFileSync(join(this.templatePath, './tsconfig.lib.json')).toString(),
      { pkg: { name: result.prefixName } }
    )
    this.prefixPkgName = result.prefixName
    this.collectFsOperation.push(async () => {
      await copy(this.templatePath, ctx),
        await writeFile(join(ctx, 'tsconfig.lib.json'), tsconfigJson)
    })
  }

  async handlePkgJson(name: string, ctx: string) {
    const pkg = {
      name,
      version: '0.1.0',
      scripts: {
        build: 'node ./script/build.js',
        changeset: 'changeset',
        'version-packages': 'changeset version',
        publish: 'changeset publish',
      },
      devDependencies: {} as any,
      dependencies: {},
    }
    const devps: Record<string, string> = {
      '@types/node': '^18.16.3',
      typescript: '^4.8.4',
      '@changesets/cli': '^2.26.1',
    }
    Object.keys(devps).forEach((key) => {
      pkg.devDependencies[key] = devps[key]
    })

    // 写 package.json
    this.collectFsOperation.push(async () => {
      writeFileTree(ctx, {
        'package.json': JSON.stringify(pkg, null, 2),
      })
      execa.sync('pnpm', ['install'], { cwd: ctx, stdio: 'inherit' })
    })
  }

  resolvePkg(ctx: string) {
    if (existsSync(join(ctx, 'package.json'))) {
      return readPkg.sync({ cwd: ctx })
    }
    return {}
  }
}
