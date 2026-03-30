import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET: 部门列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    // 检查权限
    if (user.role === 'readonly') {
      return NextResponse.json(
        { code: 403, message: '无权限访问', data: null },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: any = {
      company_id: user.company_id,
      deleted_at: null,
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const departments = await prisma.department.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { users: true, children: true } },
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: departments,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get departments error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// POST: 创建部门
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    // 检查权限（仅管理员可创建）
    if (!['company_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { code: 403, message: '无权限创建部门', data: null },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, parent_id } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { code: 400, message: '部门名称不能为空', data: null },
        { status: 400 }
      )
    }

    // 检查部门名称是否已存在
    const existingDept = await prisma.department.findFirst({
      where: {
        company_id: user.company_id,
        name: name.trim(),
        deleted_at: null,
      },
    })

    if (existingDept) {
      return NextResponse.json(
        { code: 400, message: '部门名称已存在', data: null },
        { status: 400 }
      )
    }

    // 创建部门
    const department = await prisma.department.create({
      data: {
        company_id: user.company_id,
        name: name.trim(),
        description: description?.trim() || null,
        parent_id: parent_id || null,
      },
      include: {
        parent: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      code: 0,
      message: '部门创建成功',
      data: department,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Create department error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
