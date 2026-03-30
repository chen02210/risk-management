import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/plans - 获取预案列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status')
    const deptId = searchParams.get('dept_id')
    const search = searchParams.get('search')
    const drillOverdue = searchParams.get('drill_overdue') === 'true'

    const where: any = {
      company_id: user.company_id,
      deleted_at: null,
    }

    if (status) where.status = status
    if (deptId) where.dept_id = deptId
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { plan_no: { contains: search, mode: 'insensitive' } },
        { applicable_scenario: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (drillOverdue) {
      where.next_drill = { lt: new Date() }
      where.status = 'active'
    }

    const [plans, total] = await Promise.all([
      prisma.emergencyPlan.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { created_at: 'desc' },
      }),
      prisma.emergencyPlan.count({ where }),
    ])

    // 计算演练状态
    const now = new Date()
    const plansWithStatus = plans.map(plan => {
      let drillStatus = 'normal'
      if (plan.next_drill) {
        const daysUntil = Math.ceil((plan.next_drill.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntil < 0) {
          drillStatus = 'overdue'
        } else if (daysUntil <= 7) {
          drillStatus = 'warning'
        }
      }
      return { ...plan, drill_status: drillStatus }
    })

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        list: plansWithStatus,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// POST /api/plans - 创建预案
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      linked_risk_no,
      applicable_scenario,
      trigger_condition,
      commander,
      site_commander,
      response_time_limit,
      key_steps,
      resource_needs,
      drill_frequency,
      last_drill,
      next_drill,
      drill_result,
      improvement,
      version,
      status,
      dept_id,
    } = body

    // 生成预案编号
    const count = await prisma.emergencyPlan.count({
      where: { company_id: user.company_id },
    })
    const planNo = `EP-${String(count + 1).padStart(4, '0')}`

    const plan = await prisma.emergencyPlan.create({
      data: {
        company_id: user.company_id,
        plan_no: planNo,
        name,
        linked_risk_no,
        applicable_scenario,
        trigger_condition,
        commander,
        site_commander,
        response_time_limit,
        key_steps,
        resource_needs,
        drill_frequency,
        last_drill: last_drill ? new Date(last_drill) : null,
        next_drill: next_drill ? new Date(next_drill) : null,
        drill_result,
        improvement,
        version: version || '1.0',
        latest_revision: new Date(),
        status: status || 'active',
        dept_id,
        created_by: user.id,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: plan,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Create plan error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
