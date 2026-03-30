import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateTrainingNo } from '@/lib/utils'

// GET /api/training - 获取培训列表
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
    const level = searchParams.get('level')
    const targetDept = searchParams.get('target_dept')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {
      company_id: user.company_id,
      deleted_at: null,
    }

    if (category) where.category = category
    if (level) where.level = level
    if (targetDept) where.target_dept = targetDept
    if (startDate || endDate) {
      where.training_date = {}
      if (startDate) (where.training_date as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.training_date as Record<string, Date>).lte = new Date(endDate)
    }
    if (search) {
      where.OR = [
        { topic: { contains: search, mode: 'insensitive' } },
        { training_no: { contains: search, mode: 'insensitive' } },
        { instructor: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [trainings, total] = await Promise.all([
      prisma.training.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { training_date: 'desc' },
      }),
      prisma.training.count({ where }),
    ])

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        list: trainings,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get trainings error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// POST /api/training - 创建培训记录
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
      training_date,
      topic,
      category,
      level,
      target_dept,
      plan_count,
      actual_count,
      hours,
      instructor,
      instructor_source,
      method,
      material,
      exam_method,
      pass_rate,
      effect_score,
      feedback,
      improvement,
      remark,
    } = body

    // 验证必填字段
    if (!training_date || !topic) {
      return NextResponse.json(
        { code: 400, message: '培训日期和主题为必填项', data: null },
        { status: 400 }
      )
    }

    // 生成培训编号
    const count = await prisma.training.count({
      where: { company_id: user.company_id },
    })
    const trainingNo = generateTrainingNo(count + 1)

    const training = await prisma.training.create({
      data: {
        company_id: user.company_id,
        training_no: trainingNo,
        training_date: new Date(training_date),
        topic,
        category,
        level,
        target_dept,
        plan_count: plan_count ? Number(plan_count) : null,
        actual_count: actual_count ? Number(actual_count) : null,
        hours: hours ? Number(hours) : null,
        instructor,
        instructor_source,
        method,
        material,
        exam_method,
        pass_rate: pass_rate ? Number(pass_rate) : null,
        effect_score: effect_score ? Number(effect_score) : null,
        feedback,
        improvement,
        remark,
        created_by: user.id,
      },
    })

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: training,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Create training error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
