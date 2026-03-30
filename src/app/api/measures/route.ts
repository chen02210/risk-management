import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/measures - 获取措施列表
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
    const riskId = searchParams.get('risk_id')
    const status = searchParams.get('status')
    const deptId = searchParams.get('dept_id')
    const search = searchParams.get('search')

    const where: any = {
      company_id: user.company_id,
      deleted_at: null,
    }

    if (riskId) where.risk_id = riskId
    if (status) where.status = status
    if (deptId) where.dept_id = deptId
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { effect_evaluation: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [measures, total] = await Promise.all([
      prisma.riskMeasure.findMany({
        where,
        include: {
          risk: {
            select: {
              id: true,
              risk_no: true,
              name: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { created_at: 'desc' },
      }),
      prisma.riskMeasure.count({ where }),
    ])

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        list: measures,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get measures error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// POST /api/measures - 创建新措施
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
      risk_id,
      description,
      dept_id,
      owner_id,
      collaborator_dept,
      start_date,
      plan_date,
      budget,
    } = body

    // 验证必填字段
    if (!risk_id || !description) {
      return NextResponse.json(
        { code: 400, message: '风险ID和措施描述为必填项', data: null },
        { status: 400 }
      )
    }

    // 验证风险是否存在
    const risk = await prisma.risk.findFirst({
      where: {
        id: risk_id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!risk) {
      return NextResponse.json(
        { code: 404, message: '风险不存在', data: null },
        { status: 404 }
      )
    }

    // 生成措施编号
    const count = await prisma.riskMeasure.count({
      where: { risk_id },
    })
    const measureNo = count + 1

    const measure = await prisma.riskMeasure.create({
      data: {
        company_id: user.company_id,
        risk_id,
        measure_no: measureNo,
        description,
        dept_id: dept_id || null,
        owner_id: owner_id || null,
        collaborator_dept: collaborator_dept || null,
        start_date: start_date ? new Date(start_date) : null,
        plan_date: plan_date ? new Date(plan_date) : null,
        budget: budget ? parseFloat(budget) : null,
        status: 'pending',
        created_by: user.id,
      },
      include: {
        risk: {
          select: {
            id: true,
            risk_no: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: measure,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Create measure error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
