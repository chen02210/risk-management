# 企业风险管理系统 - 部署指南

## 项目概述

这是一个基于 React + Express + SQLite 的企业风险管理系统，支持多租户架构。

## 本地运行

### 1. 安装依赖

```bash
pnpm install
```

### 2. 初始化数据库

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 3. 启动开发服务器

```bash
pnpm run dev
```

访问 http://localhost:5173/

## 生产部署到 Vercel

### 方式一：通过 Vercel CLI 部署

1. **安装 Vercel CLI**

```bash
npm i -g vercel
```

2. **登录 Vercel**

```bash
vercel login
```

3. **部署项目**

```bash
vercel --prod
```

### 方式二：通过 GitHub 部署

1. **推送代码到 GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/risk-management.git
git push -u origin main
```

2. **在 Vercel Dashboard 导入项目**

- 访问 https://vercel.com/dashboard
- 点击 "Import Project"
- 选择你的 GitHub 仓库
- 点击 "Deploy"

### 方式三：通过 Vercel Dashboard 上传

1. **构建项目**

```bash
pnpm run build
```

2. **手动打包**

```bash
tar -czvf deployment.tar.gz dist/ api/dist/ prisma/ package.json package-lock.json node_modules/.prisma prisma/migrations
```

3. **上传到 Vercel**

- 访问 https://vercel.com/dashboard
- 点击 "New Project"
- 选择 "Import Third-Party Git Repository"
- 或使用 "Upload" 选项手动上传

## 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

```
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your-production-secret-key
NODE_ENV=production
```

## 数据库配置

### SQLite (开发/小型部署)

默认使用 SQLite，数据存储在 `prisma/dev.db`。

### PostgreSQL (生产环境)

1. **创建 PostgreSQL 数据库**

推荐使用：
- 阿里云 RDS
- Supabase
- Neon
- Railway

2. **更新 DATABASE_URL**

```env
DATABASE_URL="postgresql://用户名:密码@主机:端口/数据库名"
```

3. **更新 Prisma Schema**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

4. **运行迁移**

```bash
npx prisma migrate deploy
```

## 域名配置

部署成功后，在 Vercel 项目设置中：

1. 点击 "Domains"
2. 添加你的域名（如 `risk.yourcompany.com`）
3. 按照提示配置 DNS 记录
4. 等待 SSL 证书自动配置

## 性能优化建议

### 1. 启用数据库索引

在 `prisma/schema.prisma` 中添加索引：

```prisma
model Risk {
  // ...

  @@index([companyId])
  @@index([riskLevel])
  @@index([status])
}
```

### 2. 使用缓存

添加 Redis 缓存：

```bash
pnpm add ioredis
```

### 3. 启用 Gzip 压缩

Vercel 默认启用，无需额外配置。

### 4. 使用 CDN

将静态资源部署到 CDN：

- Vercel Edge Network（默认）
- Cloudflare
- AWS CloudFront

## 监控与日志

### 添加错误追踪

```bash
pnpm add @sentry/react
```

### 添加性能监控

```bash
pnpm add @vercel/