# 包装印刷企业风险管理系统

面向包装印刷企业的新一代风险管理 SaaS 平台，支持多公司/多租户架构，实现风险管理的全流程数字化。

## 功能特性

- **多租户架构** - 公司数据完全隔离，安全可靠
- **风险登记台账** - 风险全生命周期管理
- **风险矩阵评估** - 可视化风险矩阵图
- **风险应对措施** - 应对措施跟踪管理
- **KRI 监控预警** - 指标监控/趋势分析/预警
- **应急预案管理** - 预案编制/演练记录
- **风险检查表** - 点检任务/问题整改
- **供应商风险管理** - 供应商评估/风险评级
- **培训管理** - 培训计划/记录/统计
- **系统管理** - 公司/部门/用户/角色权限

## 技术栈

- **前端**: Next.js 14 + React + TypeScript + Tailwind CSS
- **UI 组件**: Radix UI + 自定义组件
- **状态管理**: Zustand
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT + bcrypt

## 快速开始

### 1. 安装依赖

```bash
cd my-app
npm install
```

### 2. 配置数据库

```bash
# 创建 PostgreSQL 数据库
createdb risk_management

# 复制环境变量
cp .env.local .env

# 编辑 .env 文件，配置数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/risk_management?schema=public"
```

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
npm run db:generate

# 运行数据库迁移
npm run db:migrate

# 导入演示数据
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 5. 登录系统

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@example.com | admin123 |
| 安全专员 | safety@example.com | user123 |
| 生产主管 | production@example.com | user123 |

## 项目结构

```
my-app/
├── prisma/
│   ├── schema.prisma    # 数据库模型
│   └── seed.ts          # 演示数据
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── api/         # API 路由
│   │   ├── dashboard/   # 仪表盘页面
│   │   └── login/       # 登录页面
│   ├── components/      # React 组件
│   │   └── ui/          # UI 组件
│   ├── lib/             # 工具函数
│   │   ├── prisma.ts    # Prisma 客户端
│   │   ├── auth.ts      # 认证工具
│   │   └── utils.ts     # 通用工具
│   └── types/           # TypeScript 类型
├── package.json
└── README.md
```

## 开发计划

- [x] 项目初始化 (Next.js + Prisma)
- [x] 数据库设计 + 迁移
- [x] 用户认证 (JWT)
- [x] 公司/用户/部门 CRUD
- [x] 风险登记台账 (CRUD + 评估)
- [x] 仪表盘概览
- [ ] 风险矩阵可视化
- [ ] 风险应对措施
- [ ] KRI 监控预警
- [ ] 应急预案管理
- [ ] 风险检查表
- [ ] 供应商管理
- [ ] 培训管理
- [ ] 角色权限管理
- [ ] Vercel 部署

## 数据模型

### 核心表

- `companies` - 公司/租户
- `departments` - 部门
- `users` - 用户
- `risks` - 风险登记
- `risk_measures` - 应对措施
- `kris` - KRI 指标
- `kri_monthly_data` - KRI 月度数据
- `emergency_plans` - 应急预案
- `risk_checks` - 风险检查
- `suppliers` - 供应商
- `trainings` - 培训记录
- `training_stats` - 培训统计
- `audit_logs` - 审计日志

## 许可证

MIT
