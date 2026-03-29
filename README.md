# 企业风险管理系统

## 🚀 快速开始

### 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 初始化数据库
npx prisma migrate dev --name init

# 3. 启动开发服务器
pnpm run dev
```

访问 http://localhost:5173

### 生产构建

```bash
# 构建项目
pnpm run build

# 预览生产版本
pnpm run preview
```

## 📦 技术栈

- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **后端**: Express.js + Node.js
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **ORM**: Prisma
- **认证**: JWT

## 🌐 Vercel 部署

### 自动部署

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入项目
3. Vercel 会自动检测并部署

### 手动配置

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署
vercel --prod
```

### 环境变量

在 Vercel 控制台设置以下环境变量：

- `DATABASE_URL`: PostgreSQL 连接字符串
- `JWT_SECRET`: JWT 密钥（生产环境请使用强密钥）

## 🗄️ 数据库迁移

### 开发环境

```bash
# 创建迁移
npx prisma migrate dev --name init

# 重置数据库
npx prisma migrate reset
```

### 生产环境

```bash
# 部署迁移
npx prisma migrate deploy

# 生成客户端
npx prisma generate
```

## 📁 项目结构

```
danger1/
├── src/                    # 前端源码
│   ├── pages/            # 页面组件
│   ├── stores/           # 状态管理
│   ├── lib/              # 工具库
│   └── App.tsx           # 主应用
├── api/                  # 后端API
│   ├── routes/           # API路由
│   ├── middleware/       # 中间件
│   └── lib/              # 后端工具
├── prisma/               # 数据库模型
│   └── schema.prisma     # 数据库schema
└── dist/                 # 构建输出
```

## 🔧 功能模块

- ✅ 用户认证（注册/登录）
- ✅ 风险登记台账
- ✅ 管理驾驶舱
- 📊 风险矩阵
- 📈 KRI监控
- 🛡️ 应急预案
- ✅ 风险检查
- 🏭 供应商管理
- 📚 培训管理
- ⚙️ 系统设置

## 📝 使用说明

1. **注册账号**: 访问登录页面，点击"立即注册"
2. **创建公司**: 注册时可输入公司名称
3. **添加风险**: 在"风险登记台账"中点击"新增风险"
4. **查看统计**: 在"管理驾驶舱"查看风险分布

## 🔒 安全注意

- 生产环境请使用强 JWT_SECRET
- 数据库密码不要提交到代码仓库
- 建议使用环境变量管理敏感信息

## 📞 支持

如有问题，请在 GitHub 提交 Issue。
