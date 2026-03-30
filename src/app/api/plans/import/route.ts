import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// POST /api/plans/import - 导入应急预案
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
      drill_frequency,
      dept_name,
    } = body

    // 查找或创建部门
    let deptId: string | null = null
    if (dept_name) {
      const dept = await prisma.department.findFirst({
        where: {
          name: dept_name,
          company_id: user.company_id,
        },
      })
      if (dept) {
        deptId = dept.id
      } else {
        // 创建新部门
        const newDept = await prisma.department.create({
          data: {
            company_id: user.company_id,
            name: dept_name,
            level: 1,
            created_by: user.id,
          },
        })
        deptId = newDept.id
      }
    }

    // 生成预案编号
    const count = await prisma.emergencyPlan.count({
      where: { company_id: user.company_id },
    })
    const planNo = `EP-${String(count + 1).padStart(4, '0')}`

    // 创建预案
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
        drill_frequency,
        version: '1.0',
        latest_revision: new Date(),
        status: 'active',
        dept_id: deptId,
        created_by: user.id,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      code: 0,
      message: '导入成功',
      data: plan,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Import plan error:', error)
    return NextResponse.json(
      { code: 500, message: `导入失败: ${(error as Error).message}`, data: null },
      { status: 500 }
    )
  }
}
