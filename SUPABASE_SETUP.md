# Supabase数据库配置指南

## 数据库连接信息

**项目引用**: `xsgexddcaowtsxqnolrg`
**密码**: `Bzk@34425016`

## 完整连接字符串

```
postgresql://postgres:Bzk@34425016@db.xsgexddcaowtsxqnolrg.supabase.co:5432/postgres
```

## Vercel环境变量配置

### 在Vercel Dashboard中配置：

1. 访问：https://vercel.com/dashboard
2. 选择项目：`risk-management`
3. Settings → Environment Variables
4. 添加以下环境变量：

| Name | Value | Environments |
|------|-------|--------------|
| DATABASE_URL | `postgresql://postgres:Bzk@34425016@db.xsgexddcaowtsxqnolrg.supabase.co:5432/postgres` | Production, Preview, Development |

5. 点击 Save
6. 前往 Deployments → 最新部署 → Redeploy

## 数据库迁移

配置完环境变量并重新部署后，需要运行迁移：

```bash
cd risk-management
npx prisma migrate deploy
```

或者在Supabase的SQL Editor中执行迁移脚本。
