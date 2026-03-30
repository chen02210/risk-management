import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/measures/[id] - 获取措施详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const { id } = await params

    const measure = await prisma.riskMeasure.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
      include: {
        risk: {
          select: {
            id: true,
            risk_no: true,
            name: true,
            category: true,
            risk_level: true,
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
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!measure) {
      return NextResponse.json(
        { code: 404, message: '措施不存在', data: null },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: measure,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get measure error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// PUT /api/measures/[id] - 更新措施
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const { id } = await params

    // 验证措施是否存在
    const existingMeasure = await prisma.riskMeasure.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingMeasure) {
      return NextResponse.json(
        { code: 404, message: '措施不存在', data: null },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      description,
      dept_id,
      owner_id,
      collaborator_dept,
      start_date,
      plan_date,
      actual_date,
      budget,
      actual_cost,
      status,
      effect_evaluation,
      remaining_issue,
    } = body

    // 构建更新数据
    const updateData: any = {
      updated_by: user.id,
    }

    if (description !== undefined) updateData.description = description
    if (dept_id !== undefined) updateData.dept_id = dept_id || null
    if (owner_id !== undefined) updateData.owner_id = owner_id || null
    if (collaborator_dept !== undefined) updateData.collaborator_dept = collaborator_dept || null
    if (start_date !== undefined) updateData.start_date = start_date ? new Date(start_date) : null
    if (plan_date !== undefined) updateData.plan_date = plan_date ? new Date(plan_date) : null
    if (actual_date !== undefined) updateData.actual_date = actual_date ? new Date(actual_date) : null
    if (budget !== undefined) updateData.budget = budget ? parseFloat(budget) : null
    if (actual_cost !== undefined) updateData.actual_cost = actual_cost ? parseFloat(actual_cost) : null
    if (status !== undefined) updateData.status = status
    if (effect_evaluation !== undefined) updateData.effect_evaluation = effect_evaluation || null
    if (remaining_issue !== undefined) updateData.remaining_issue = remaining_issue || null

    const measure = await prisma.riskMeasure.update({
      where: { id },
      data: updateData,
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
      message: '更新成功',
      data: measure,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Update measure error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// DELETE /api/measures/[id] - 删除措施
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const { id } = await params

    // 验证措施是否存在
    const existingMeasure = await prisma.riskMeasure.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingMeasure) {
      return NextResponse.json(
        { code: 404, message: '措施不存在', data: null },
        { status: 404 }
      )
    }

    // 软删除
    await prisma.riskMeasure.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_by: user.id,
      },
    })

    return NextResponse.json({
      code: 0,
      message: '删除成功',
      data: null,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Delete measure error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
