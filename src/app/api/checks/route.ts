import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/checks - 获取检查记录列表
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
    const result = searchParams.get('result')
    const area = searchParams.get('area')
    const category = searchParams.get('category')
    const riskLevel = searchParams.get('risk_level')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const overdue = searchParams.get('overdue')
    const pendingVerify = searchParams.get('pending_verify')
    const search = searchParams.get('search')

    const where: any = {
      company_id: user.company_id,
      deleted_at: null,
    }

    // 按结果筛选
    if (result) where.result = result
    
    // 按区域筛选
    if (area) where.area = area
    
    // 按类别筛选
    if (category) where.category = category
    
    // 按风险等级筛选
    if (riskLevel) where.risk_level = riskLevel
    
    // 按日期范围筛选
    if (startDate || endDate) {
      where.check_date = {}
      if (startDate) where.check_date.gte = new Date(startDate)
      if (endDate) where.check_date.lte = new Date(endDate)
    }
    
    // 逾期筛选（整改期限已过但未验收或验收未通过）
    if (overdue === 'true') {
      where.deadline = { lt: new Date() }
      where.OR = [
        { verify_result: null },
        { verify_result: 'pending' },
        { verify_result: 'failed' },
      ]
    }
    
    // 待验收筛选
    if (pendingVerify === 'true') {
      where.result = 'fail'
      where.OR = [
        { verify_result: null },
        { verify_result: 'pending' },
      ]
    }
    
    // 搜索
    if (search) {
      where.OR = [
        { check_no: { contains: search, mode: 'insensitive' } },
        { check_item: { contains: search, mode: 'insensitive' } },
        { standard: { contains: search, mode: 'insensitive' } },
        { issue_desc: { contains: search, mode: 'insensitive' } },
        { checker: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [checks, total] = await Promise.all([
      prisma.riskCheck.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { check_date: 'desc' },
      }),
      prisma.riskCheck.count({ where }),
    ])

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        list: checks,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get checks error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// POST /api/checks - 创建检查记录
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
      check_no,
      area,
      category,
      check_item,
      standard,
      method,
      check_date,
      checker,
      result,
      issue_desc,
      risk_level,
      measure,
      owner_id,
      deadline,
    } = body

    // 验证必填字段
    if (!check_item || !check_date) {
      return NextResponse.json(
        { code: 400, message: '检查项目和检查日期为必填项', data: null },
        { status: 400 }
      )
    }

    // 如果检查结果为不合格，需要填写问题描述和风险等级
    if (result === 'fail' && (!issue_desc || !risk_level)) {
      return NextResponse.json(
        { code: 400, message: '不合格检查需要填写问题描述和风险等级', data: null },
        { status: 400 }
      )
    }

    // 生成检查编号（如果没有提供）
    let finalCheckNo = check_no
    if (!finalCheckNo) {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const count = await prisma.riskCheck.count({
        where: { company_id: user.company_id },
      })
      finalCheckNo = `CHK-${year}${month}-${String(count + 1).padStart(4, '0')}`
    }

    // 检查编号是否已存在
    const existingCheck = await prisma.riskCheck.findFirst({
      where: {
        company_id: user.company_id,
        check_no: finalCheckNo,
      },
    })

    if (existingCheck) {
      return NextResponse.json(
        { code: 400, message: '检查编号已存在', data: null },
        { status: 400 }
      )
    }

    const check = await prisma.riskCheck.create({
      data: {
        company_id: user.company_id,
        check_no: finalCheckNo,
        area: area || null,
        category: category || null,
        check_item,
        standard: standard || null,
        method: method || null,
        check_date: new Date(check_date),
        checker: checker || null,
        result: result || null,
        issue_desc: issue_desc || null,
        risk_level: risk_level || null,
        measure: measure || null,
        owner_id: owner_id || null,
        deadline: deadline ? new Date(deadline) : null,
        created_by: user.id,
      },
      include: {
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
      data: check,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Create check error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
