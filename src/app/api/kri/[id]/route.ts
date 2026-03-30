import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/kri/[id] - 获取KRI详情
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

    const kri = await prisma.kRI.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
      include: {
        department: { select: { id: true, name: true } },
        monthly_data: {
          orderBy: { month: 'desc' },
          take: 12,
        },
        _count: { select: { monthly_data: true } },
      },
    })

    if (!kri) {
      return NextResponse.json(
        { code: 404, message: 'KRI指标不存在', data: null },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: kri,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get KRI detail error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// PUT /api/kri/[id] - 更新KRI
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

    // 检查KRI是否存在
    const existingKri = await prisma.kRI.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingKri) {
      return NextResponse.json(
        { code: 404, message: 'KRI指标不存在', data: null },
        { status: 404 }
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

    // 验证阈值逻辑
    if (warning_threshold !== undefined && alert_threshold !== undefined) {
      const warnVal = parseFloat(warning_threshold)
      const alertVal = parseFloat(alert_threshold)
      
      if (warnVal === alertVal) {
        return NextResponse.json(
          { code: 400, message: '黄色预警线和红色警戒线不能相同', data: null },
          { status: 400 }
        )
      }
    }

    const kri = await prisma.kRI.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        linked_risk_no: linked_risk_no !== undefined ? linked_risk_no || null : undefined,
        description: description !== undefined ? description || null : undefined,
        formula: formula !== undefined ? formula || null : undefined,
        frequency: frequency !== undefined ? frequency : undefined,
        unit: unit !== undefined ? unit || null : undefined,
        target: target !== undefined ? (target !== null ? parseFloat(target) : null) : undefined,
        warning_threshold: warning_threshold !== undefined 
          ? (warning_threshold !== null ? parseFloat(warning_threshold) : null) 
          : undefined,
        alert_threshold: alert_threshold !== undefined 
          ? (alert_threshold !== null ? parseFloat(alert_threshold) : null) 
          : undefined,
        dept_id: dept_id !== undefined ? dept_id || null : undefined,
        updated_at: new Date(),
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      code: 0,
      message: '更新成功',
      data: kri,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Update KRI error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// DELETE /api/kri/[id] - 删除KRI（软删除）
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

    // 检查KRI是否存在
    const existingKri = await prisma.kRI.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingKri) {
      return NextResponse.json(
        { code: 404, message: 'KRI指标不存在', data: null },
        { status: 404 }
      )
    }

    // 软删除
    await prisma.kRI.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      code: 0,
      message: '删除成功',
      data: null,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Delete KRI error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
