# Release 发布

## 流程

1. 更新版本号：修改 `package.json` 中的 `version`，例如 `1.5.0`。
2. 本地验证并构建：

   ```bash
   pnpm install --frozen-lockfile
   pnpm typecheck
   pnpm lint
   pnpm build
   ```

3. 提交并推送：

   ```bash
   git add .
   git commit -m "feat: release 1.5.0"
   git push origin main
   ```

4. 打 tag 并推送：

   ```bash
   git tag v1.5.0
   git push origin v1.5.0
   ```

5. 等待 GitHub Actions 完成，自动创建 Release 并上传 `dist/dy-dl.user.js`。

## 发布产物

安装和自动更新地址：

```text
https://github.com/zhzLuke96/douyin-dl-user-js/releases/latest/download/dy-dl.user.js
```

## 说明

- tag 格式必须为 `v*`，否则不会触发 `.github/workflows/release.yml`。
- Release 备注由 GitHub 根据提交历史自动生成。
- 首次发布前 `latest` 链接会 404，发布过一次后才会可用。
- 重复推送同一个 tag 会失败；需要换新 tag，或先删除远端旧 tag 再重建。