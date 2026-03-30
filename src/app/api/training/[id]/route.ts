import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/training/[id] - 获取单个培训记录
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const { id } = params

    const training = await prisma.training.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!training) {
      return NextResponse.json(
        { code: 404, message: '培训记录不存在', data: null },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: training,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get training error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// PUT /api/training/[id] - 更新培训记录
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const { id } = params
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

    // 检查培训记录是否存在
    const existingTraining = await prisma.training.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingTraining) {
      return NextResponse.json(
        { code: 404, message: '培训记录不存在', data: null },
        { status: 404 }
      )
    }

    const training = await prisma.training.update({
      where: { id },
      data: {
        training_date: training_date ? new Date(training_date) : undefined,
        topic,
        category,
        level,
        target_dept,
        plan_count: plan_count !== undefined ? Number(plan_count) : undefined,
        actual_count: actual_count !== undefined ? Number(actual_count) : undefined,
        hours: hours !== undefined ? Number(hours) : undefined,
        instructor,
        instructor_source,
        method,
        material,
        exam_method,
        pass_rate: pass_rate !== undefined ? Number(pass_rate) : undefined,
        effect_score: effect_score !== undefined ? Number(effect_score) : undefined,
        feedback,
        improvement,
        remark,
      },
    })

    return NextResponse.json({
      code: 0,
      message: '更新成功',
      data: training,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Update training error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// DELETE /api/training/[id] - 删除培训记录（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const { id } = params

    // 检查培训记录是否存在
    const existingTraining = await prisma.training.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingTraining) {
      return NextResponse.json(
        { code: 404, message: '培训记录不存在', data: null },
        { status: 404 }
      )
    }

    await prisma.training.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    })

    return NextResponse.json({
      code: 0,
      message: '删除成功',
      data: null,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Delete training error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// PATCH /api/training/[id] - 部分更新培训记录
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    // 检查培训记录是否存在
    const existingTraining = await prisma.training.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingTraining) {
      return NextResponse.json(
        { code: 404, message: '培训记录不存在', data: null },
        { status: 404 }
      )
    }

    // 处理日期字段
    const updateData: Record<string, unknown> = { ...body }
    if (body.training_date !== undefined) {
      updateData.training_date = new Date(body.training_date)
    }
    if (body.plan_count !== undefined) {
      updateData.plan_count = Number(body.plan_count)
    }
    if (body.actual_count !== undefined) {
      updateData.actual_count = Number(body.actual_count)
    }
    if (body.hours !== undefined) {
      updateData.hours = Number(body.hours)
    }
    if (body.pass_rate !== undefined) {
      updateData.pass_rate = Number(body.pass_rate)
    }
    if (body.effect_score !== undefined) {
      updateData.effect_score = Number(body.effect_score)
    }

    const training = await prisma.training.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      code: 0,
      message: '更新成功',
      data: training,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Patch training error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
