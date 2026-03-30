import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')

  // 创建演示公司
  const company = await prisma.company.create({
    data: {
      name: '演示包装印刷有限公司',
      domain: 'demo',
      plan: 'enterprise',
      status: 'active',
    },
  })
  console.log('创建公司:', company.name)

  // 创建部门
  const departments = await prisma.$transaction([
    prisma.department.create({
      data: {
        company_id: company.id,
        name: '安全生产部',
      },
    }),
    prisma.department.create({
      data: {
        company_id: company.id,
        name: '生产运营部',
      },
    }),
    prisma.department.create({
      data: {
        company_id: company.id,
        name: '质量管理部',
      },
    }),
    prisma.department.create({
      data: {
        company_id: company.id,
        name: '采购部',
      },
    }),
    prisma.department.create({
      data: {
        company_id: company.id,
        name: '财务部',
      },
    }),
  ])
  console.log('创建部门数量:', departments.length)

  // 创建管理员用户
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      company_id: company.id,
      email: 'admin@example.com',
      name: '系统管理员',
      password: adminPassword,
      role: 'company_admin',
      dept_id: departments[0].id,
      status: 'active',
    },
  })
  console.log('创建管理员:', admin.name)

  // 创建普通用户
  const userPassword = await bcrypt.hash('user123', 12)
  const users = await prisma.$transaction([
    prisma.user.create({
      data: {
        company_id: company.id,
        email: 'safety@example.com',
        name: '安全专员',
        password: userPassword,
        role: 'user',
        dept_id: departments[0].id,
        status: 'active',
      },
    }),
    prisma.user.create({
      data: {
        company_id: company.id,
        email: 'production@example.com',
        name: '生产主管',
        password: userPassword,
        role: 'dept_admin',
        dept_id: departments[1].id,
        status: 'active',
      },
    }),
    prisma.user.create({
      data: {
        company_id: company.id,
        email: 'quality@example.com',
        name: '质量工程师',
        password: userPassword,
        role: 'user',
        dept_id: departments[2].id,
        status: 'active',
      },
    }),
  ])
  console.log('创建普通用户数量:', users.length)

  // 创建示例风险数据
  const risks = await prisma.$transaction([
    prisma.risk.create({
      data: {
        company_id: company.id,
        risk_no: 'S-001',
        name: '印刷车间 VOCs 废气排放超标风险',
        category: 'safety',
        description: '印刷过程中使用的油墨、清洗剂会产生 VOCs 废气，如收集处理不当可能导致排放超标',
        consequence: '环保处罚、停产整顿、声誉受损',
        source: '生产工艺',
        likelihood: 3,
        impact: 4,
        risk_value: 12,
        risk_level: '高',
        response_strategy: 'reduce',
        dept_id: departments[0].id,
        owner_id: users[0].id,
        status: 'active',
        next_evaluate_at: new Date('2026-06-30'),
        created_by: admin.id,
      },
    }),
    prisma.risk.create({
      data: {
        company_id: company.id,
        risk_no: 'S-002',
        name: '危险化学品储存安全风险',
        category: 'safety',
        description: '乙醇、异丙醇等易燃化学品储存不当可能引发火灾爆炸',
        consequence: '人员伤亡、财产损失、停产',
        source: '物料储存',
        likelihood: 2,
        impact: 5,
        risk_value: 10,
        risk_level: '中',
        response_strategy: 'reduce',
        dept_id: departments[0].id,
        owner_id: users[0].id,
        status: 'active',
        next_evaluate_at: new Date('2026-06-30'),
        created_by: admin.id,
      },
    }),
    prisma.risk.create({
      data: {
        company_id: company.id,
        risk_no: 'P-001',
        name: '关键设备故障导致停产风险',
        category: 'production',
        description: '印刷机、模切机等关键设备突发故障可能导致订单交付延迟',
        consequence: '订单违约、客户流失、经济损失',
        source: '设备运维',
        likelihood: 3,
        impact: 4,
        risk_value: 12,
        risk_level: '高',
        response_strategy: 'reduce',
        dept_id: departments[1].id,
        owner_id: users[1].id,
        status: 'active',
        next_evaluate_at: new Date('2026-06-30'),
        created_by: admin.id,
      },
    }),
    prisma.risk.create({
      data: {
        company_id: company.id,
        risk_no: 'Q-001',
        name: '印刷色差质量风险',
        category: 'quality',
        description: '印刷过程中颜色控制不稳定，导致批次间色差超标',
        consequence: '客户退货、返工成本、质量索赔',
        source: '生产过程',
        likelihood: 4,
        impact: 3,
        risk_value: 12,
        risk_level: '高',
        response_strategy: 'reduce',
        dept_id: departments[2].id,
        owner_id: users[2].id,
        status: 'active',
        next_evaluate_at: new Date('2026-06-30'),
        created_by: admin.id,
      },
    }),
    prisma.risk.create({
      data: {
        company_id: company.id,
        risk_no: 'C-001',
        name: '核心原材料供应中断风险',
        category: 'supply_chain',
        description: '进口特种纸张供应商集中度高，地缘政治可能导致供应中断',
        consequence: '停产待料、订单违约、客户流失',
        source: '供应链',
        likelihood: 2,
        impact: 5,
        risk_value: 10,
        risk_level: '中',
        response_strategy: 'transfer',
        dept_id: departments[3].id,
        owner_id: admin.id,
        status: 'active',
        next_evaluate_at: new Date('2026-06-30'),
        created_by: admin.id,
      },
    }),
  ])
  console.log('创建风险数量:', risks.length)

  // 创建应对措施
  const measures = await prisma.$transaction([
    prisma.riskMeasure.create({
      data: {
        company_id: company.id,
        risk_id: risks[0].id,
        measure_no: 1,
        description: '安装 VOCs 在线监测系统，实时监控排放浓度',
        dept_id: departments[0].id,
        owner_id: users[0].id,
        plan_date: new Date('2026-04-30'),
        budget: 15.5,
        status: 'in_progress',
        created_by: admin.id,
      },
    }),
    prisma.riskMeasure.create({
      data: {
        company_id: company.id,
        risk_id: risks[0].id,
        measure_no: 2,
        description: '升级 RTO 蓄热式焚烧炉，提高处理效率',
        dept_id: departments[0].id,
        owner_id: users[0].id,
        plan_date: new Date('2026-05-31'),
        budget: 80.0,
        status: 'pending',
        created_by: admin.id,
      },
    }),
    prisma.riskMeasure.create({
      data: {
        company_id: company.id,
        risk_id: risks[2].id,
        measure_no: 1,
        description: '建立设备预防性维护计划，定期保养关键设备',
        dept_id: departments[1].id,
        owner_id: users[1].id,
        plan_date: new Date('2026-04-15'),
        budget: 5.0,
        status: 'completed',
        actual_date: new Date('2026-03-20'),
        actual_cost: 4.8,
        created_by: admin.id,
      },
    }),
  ])
  console.log('创建措施数量:', measures.length)

  // 创建KRI指标
  const kris = await prisma.$transaction([
    prisma.kRI.create({
      data: {
        company_id: company.id,
        kri_no: 'KRI-001',
        name: 'VOCs 排放浓度',
        linked_risk_no: 'S-001',
        formula: 'RTO出口VOCs浓度监测值',
        frequency: 'daily',
        unit: 'mg/m³',
        target: 30.0,
        warning_threshold: 40.0,
        alert_threshold: 50.0,
        dept_id: departments[0].id,
        created_by: admin.id,
      },
    }),
    prisma.kRI.create({
      data: {
        company_id: company.id,
        kri_no: 'KRI-002',
        name: '设备故障停机时间',
        linked_risk_no: 'P-001',
        formula: '月度设备故障停机小时数',
        frequency: 'monthly',
        unit: '小时',
        target: 8.0,
        warning_threshold: 16.0,
        alert_threshold: 24.0,
        dept_id: departments[1].id,
        created_by: admin.id,
      },
    }),
  ])
  console.log('创建KRI数量:', kris.length)

  console.log('数据库初始化完成！')
  console.log('\n登录信息：')
  console.log('管理员: admin@example.com / admin123')
  console.log('普通用户: safety@example.com / user123')
  console.log('        production@example.com / user123')
  console.log('        quality@example.com / user123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
