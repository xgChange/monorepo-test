# monorepo-test

monorepo 测试仓库

```
发包步骤

# 1-1 进行了一些开发...
# 1-2 提交变更集
pnpm changeset
# 1-3 提升版本
pnpm version-packages # changeset version
# 1-4 git add .
# 1-5 git commit -m ""
# 1-6 git push
# 1-10 git push --follow-tags

# 1-7 走 ci
# 1-8 ci 里面执行 npm release 
# 1-9 release 里面会进行 build + publish

```
