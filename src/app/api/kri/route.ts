import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// 生成KRI编号
function generateKRINo(sequence: number): string {
  return `KRI-${String(sequence).padStart(4, '0')}`
}

// GET /api/kri - 获取KRI指标列表
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
    const withLatestData = searchParams.get('with_latest_data') === 'true'

    const where: Record<string, unknown> = {
      company_id: user.company_id,
      deleted_at: null,
    }

    if (deptId) where.dept_id = deptId
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { kri_no: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [kris, total] = await Promise.all([
      prisma.kRI.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          monthly_data: withLatestData ? {
            orderBy: { month: 'desc' },
            take: 1,
          } : undefined,
          _count: { select: { monthly_data: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { created_at: 'desc' },
      }),
      prisma.kRI.count({ where }),
    ])

    // 如果提供了status参数，过滤出对应状态的KRI
    let filteredKris = kris
    if (status && withLatestData) {
      filteredKris = kris.filter((kri: { monthly_data?: { status: string }[] }) => {
        const latestData = kri.monthly_data?.[0]
        if (!latestData) return status === 'normal'
        return latestData.status === status
      })
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        list: filteredKris,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get KRI list error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// POST /api/kri - 创建KRI指标
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
      description,
      formula,
      frequency,
      unit,
      target,
      warning_threshold,
      alert_threshold,
      dept_id,
    } = body

    // 验证必填字段
    if (!name) {
      return NextResponse.json(
        { code: 400, message: 'KRI名称为必填项', data: null },
        { status: 400 }
      )
    }

    // 验证阈值逻辑
    if (warning_threshold !== undefined && alert_threshold !== undefined) {
      // 支持两种阈值模式：
      // 1. 目标值越小越好（如：事故率）: target < warning < alert
      // 2. 目标值越大越好（如：合格率）: target > warning > alert
      const warnVal = parseFloat(warning_threshold)
      const alertVal = parseFloat(alert_threshold)
      
      if (warnVal === alertVal) {
        return NextResponse.json(
          { code: 400, message: '黄色预警线和红色警戒线不能相同', data: null },
          { status: 400 }
        )
      }
    }

    // 生成KRI编号
    const count = await prisma.kRI.count({
      where: { company_id: user.company_id },
    })
    const kriNo = generateKRINo(count + 1)

    const kri = await prisma.kRI.create({
      data: {
        company_id: user.company_id,
        kri_no: kriNo,
        name,
        linked_risk_no: linked_risk_no || null,
        description: description || null,
        formula: formula || null,
        frequency: frequency || 'monthly',
        unit: unit || null,
        target: target !== undefined ? parseFloat(target) : null,
        warning_threshold: warning_threshold !== undefined ? parseFloat(warning_threshold) : null,
        alert_threshold: alert_threshold !== undefined ? parseFloat(alert_threshold) : null,
        dept_id: dept_id || null,
        created_by: user.id,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: kri,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Create KRI error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
