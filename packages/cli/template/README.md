> 也可以参照 pnpm [pnpm搭配changeset](https://pnpm.io/zh/using-changesets)

发包步骤(可以自行调整)：
1. 进行开发
2. pnpm changeset
3. pnpm version-packages
4. pnpm build
4. git add .
5. git commit -m ""
6. git push
7. pnpm publish
