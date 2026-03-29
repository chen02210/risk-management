# 🚀 Vercel 部署指南

## 📋 部署前准备

### 1. 创建 GitHub 仓库

在 GitHub 上创建新仓库（不要勾选 README）：

**仓库名称**: `risk-management`

**步骤**:
1. 访问 https://github.com/new
2. Repository name: `risk-management`
3. Description: `企业风险管理系统 - 面向包装印刷企业的风险管理SaaS平台`
4. 选择 Private（私有）或 Public（公开）
5. 点击 "Create repository"

### 2. 推送代码到 GitHub

在项目目录执行以下命令（将 `YOUR_USERNAME` 替换为你的 GitHub 用户名）:

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/risk-management.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 3. 配置 Vercel

#### 方法一：通过 GitHub 集成（推荐）

1. 访问 https://vercel.com/new
2. 点击 "Import Git Repository"
3. 选择你刚创建的 `risk-management` 仓库
4. 在配置页面设置：
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`

#### 方法二：使用 Vercel CLI

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 在项目目录部署
cd risk-management
vercel

# 4. 生产部署
vercel --prod
```

## 🔧 环境变量配置

在 Vercel 控制台添加以下环境变量：

### 必须配置

```
DATABASE_URL=postgresql://用户名:密码@主机:5432/数据库名
JWT_SECRET=risk-management-jwt-secret-2026-very-secure-key
```

### 数据库选项

#### 选项 A: Vercel Postgres（推荐）

1. 在 Vercel Dashboard 创建 Postgres 数据库
2. 复制连接字符串到 `DATABASE_URL`
3. 运行迁移：`npx prisma migrate deploy`

#### 选项 B: 阿里云 RDS

```bash
DATABASE_URL=postgresql://用户名:密码@rm-xxxxx.pg.rds.aliyuncs.com:5432/risk_management
```

#### 选项 C: Supabase

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## 🌐 域名配置（可选）

1. 在 Vercel 项目设置 → Domains
2. 添加你的域名（如 `risk.yourcompany.com`）
3. 按照指示配置 DNS 记录
4. 等待 DNS 生效（通常几分钟）

## 📊 部署后验证

1. 访问 Vercel 提供的预览URL（如 `https://risk-management.vercel.app`）
2. 测试注册/登录功能
3. 验证数据库连接
4. 测试核心功能（添加风险、查看统计等）

## 🔄 更新部署

### 自动部署

推送到 GitHub 后，Vercel 会自动构建和部署：

```bash
# 修改代码后
git add .
git commit -m "更新说明"
git push origin main
```

### 手动触发

在 Vercel Dashboard 点击 "Redeploy"

## ❌ 常见问题

### 构建失败

**错误**: `Command "pnpm build" exited with 1`

**解决**:
1. 检查 `package.json` 的 build 命令
2. 确保所有依赖在 `dependencies` 中（不是 devDependencies）
3. 查看构建日志定位具体错误

### 数据库连接失败

**错误**: `Can't reach database server`

**解决**:
1. 确认 `DATABASE_URL` 环境变量正确
2. 检查数据库是否允许远程连接
3. 对于 PostgreSQL，确保密码中没有特殊字符或正确 URL 编码

### Prisma 迁移错误

**错误**: `P1001: Can't find database`

**解决**:
```bash
# 本地运行迁移
npx prisma migrate deploy

# 或使用 Prisma Studio 查看数据库
npx prisma studio
```

## 🎯 生产环境检查清单

- [ ] 配置生产环境数据库（不是 SQLite）
- [ ] 设置强 JWT_SECRET（至少 32 位随机字符）
- [ ] 配置自定义域名（可选）
- [ ] 启用 HTTPS（Vercel 自动提供）
- [ ] 测试所有功能
- [ ] 设置监控和日志（可选）

## 📞 获取帮助

- Vercel 文档: https://vercel.com/docs
- Prisma 文档: https://prisma.io/docs
- GitHub Issues: 在仓库中创建 Issue

## 💡 提示

1. **先用预览部署测试**: 先用 `vercel` 部署到预览环境，验证无误后再 `vercel --prod`
2. **查看日志**: Vercel 提供实时构建日志，便于调试
3. **回滚**: 如果新版本有问题，可以一键回滚到之前的部署
4. **环境分离**: 预览环境和生产环境使用不同的数据库

---

**部署成功！🎉**

部署完成后，你的风险管理系统将可以通过互联网访问。
