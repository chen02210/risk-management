import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/plans/[id] - 获取预案详情
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

    const plan = await prisma.emergencyPlan.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { code: 404, message: '预案不存在', data: null },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: plan,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get plan error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// PUT /api/plans/[id] - 更新预案
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

    // 检查预案是否存在
    const existingPlan = await prisma.emergencyPlan.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { code: 404, message: '预案不存在', data: null },
        { status: 404 }
      )
    }

    const plan = await prisma.emergencyPlan.update({
      where: { id },
      data: {
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
        version,
        latest_revision: new Date(),
        status,
        dept_id,
        updated_by: user.id,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      code: 0,
      message: '更新成功',
      data: plan,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Update plan error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// DELETE /api/plans/[id] - 删除预案（软删除）
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

    // 检查预案是否存在
    const existingPlan = await prisma.emergencyPlan.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { code: 404, message: '预案不存在', data: null },
        { status: 404 }
      )
    }

    await prisma.emergencyPlan.update({
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
    console.error('Delete plan error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// PATCH /api/plans/[id] - 部分更新（如更新演练记录、版本升级等）
export async function PATCH(
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
    const body = await request.json()

    // 检查预案是否存在
    const existingPlan = await prisma.emergencyPlan.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { code: 404, message: '预案不存在', data: null },
        { status: 404 }
      )
    }

    const plan = await prisma.emergencyPlan.update({
      where: { id },
      data: {
        ...body,
        last_drill: body.last_drill ? new Date(body.last_drill) : undefined,
        next_drill: body.next_drill ? new Date(body.next_drill) : undefined,
        latest_revision: new Date(),
        updated_by: user.id,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      code: 0,
      message: '更新成功',
      data: plan,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Patch plan error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
