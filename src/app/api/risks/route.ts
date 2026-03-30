import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { calculateRiskLevel, generateRiskNo } from '@/lib/utils'

// GET /api/risks - 获取风险列表
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
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const riskLevel = searchParams.get('risk_level')
    const deptId = searchParams.get('dept_id')
    const search = searchParams.get('search')

    const where: any = {
      company_id: user.company_id,
      deleted_at: null,
    }

    if (category) where.category = category
    if (status) where.status = status
    if (riskLevel) where.risk_level = riskLevel
    if (deptId) where.dept_id = deptId
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { risk_no: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [risks, total] = await Promise.all([
      prisma.risk.findMany({
        where,
        include: {
          department: true,
          owner: { select: { id: true, name: true } },
          _count: { select: { measures: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { created_at: 'desc' },
      }),
      prisma.risk.count({ where }),
    ])

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        list: risks,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get risks error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// POST /api/risks - 创建风险
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
    const { name, category, description, consequence, source, likelihood, impact, response_strategy, dept_id, owner_id, next_evaluate_at } = body

    // 计算风险值和等级
    const riskValue = likelihood * impact
    const riskLevel = calculateRiskLevel(riskValue)

    // 生成风险编号
    const count = await prisma.risk.count({
      where: { company_id: user.company_id, category },
    })
    const riskNo = generateRiskNo(category, count + 1)

    const risk = await prisma.risk.create({
      data: {
        company_id: user.company_id,
        risk_no: riskNo,
        name,
        category,
        description,
        consequence,
        source,
        likelihood,
        impact,
        risk_value: riskValue,
        risk_level: riskLevel,
        response_strategy,
        dept_id,
        owner_id,
        next_evaluate_at: next_evaluate_at ? new Date(next_evaluate_at) : null,
        created_by: user.id,
      },
      include: {
        department: true,
        owner: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: risk,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Create risk error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
