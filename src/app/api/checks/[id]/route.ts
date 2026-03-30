import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/checks/[id] - 获取检查记录详情
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

    const check = await prisma.riskCheck.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
      include: {
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

    if (!check) {
      return NextResponse.json(
        { code: 404, message: '检查记录不存在', data: null },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: check,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get check error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// PUT /api/checks/[id] - 更新检查记录
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

    // 验证检查记录是否存在
    const existingCheck = await prisma.riskCheck.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingCheck) {
      return NextResponse.json(
        { code: 404, message: '检查记录不存在', data: null },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
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
      verify_date,
      verify_result,
      verifier,
    } = body

    // 如果检查结果为不合格，需要填写问题描述和风险等级
    if (result === 'fail' && (!issue_desc || !risk_level)) {
      return NextResponse.json(
        { code: 400, message: '不合格检查需要填写问题描述和风险等级', data: null },
        { status: 400 }
      )
    }

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date(),
    }

    if (area !== undefined) updateData.area = area || null
    if (category !== undefined) updateData.category = category || null
    if (check_item !== undefined) updateData.check_item = check_item
    if (standard !== undefined) updateData.standard = standard || null
    if (method !== undefined) updateData.method = method || null
    if (check_date !== undefined) updateData.check_date = new Date(check_date)
    if (checker !== undefined) updateData.checker = checker || null
    if (result !== undefined) updateData.result = result || null
    if (issue_desc !== undefined) updateData.issue_desc = issue_desc || null
    if (risk_level !== undefined) updateData.risk_level = risk_level || null
    if (measure !== undefined) updateData.measure = measure || null
    if (owner_id !== undefined) updateData.owner_id = owner_id || null
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null
    if (verify_date !== undefined) updateData.verify_date = verify_date ? new Date(verify_date) : null
    if (verify_result !== undefined) updateData.verify_result = verify_result || null
    if (verifier !== undefined) updateData.verifier = verifier || null

    const check = await prisma.riskCheck.update({
      where: { id },
      data: updateData,
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
      message: '更新成功',
      data: check,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Update check error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// DELETE /api/checks/[id] - 删除检查记录
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

    // 验证检查记录是否存在
    const existingCheck = await prisma.riskCheck.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingCheck) {
      return NextResponse.json(
        { code: 404, message: '检查记录不存在', data: null },
        { status: 404 }
      )
    }

    // 软删除
    await prisma.riskCheck.update({
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
    console.error('Delete check error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
