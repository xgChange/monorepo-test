# monorepo-test

monorepo 测试仓库

```
发包步骤

# 1-1 进行了一些开发...
# 1-2 提交变更集
pnpm changeset
# 1-3 提升版本
pnpm version-packages # changeset version
# 1-4 发包
pnpm release # pnpm build && pnpm changeset publish --registry=...
# 1-5 得到 1.0.0-beta.1

# 2-1 进行了一些开发...
# 2-2 提交变更集
pnpm changeset
# 2-3 提升版本
pnpm version-packages
# 2-4 发包
pnpm release
# 2-5 得到 1.0.0-beta.2
```
