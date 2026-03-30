import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword } from '@/lib/auth'

// GET: 用户列表（分页）
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
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search')
    const deptId = searchParams.get('deptId')
    const role = searchParams.get('role')

    const where: any = {
      company_id: user.company_id,
      deleted_at: null,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (deptId) {
      where.dept_id = deptId
    }

    if (role) {
      where.role = role
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    // 移除密码字段
    const usersWithoutPassword = users.map(u => {
      const { password, ...rest } = u
      return rest
    })

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        list: usersWithoutPassword,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// POST: 创建用户
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    // 检查权限（仅管理员可创建用户）
    if (!['company_admin', 'super_admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { code: 403, message: '无权限创建用户', data: null },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, name, phone, role, dept_id, status } = body

    // 验证必填字段
    if (!email || email.trim() === '') {
      return NextResponse.json(
        { code: 400, message: '邮箱不能为空', data: null },
        { status: 400 }
      )
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { code: 400, message: '姓名不能为空', data: null },
        { status: 400 }
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { code: 400, message: '邮箱格式不正确', data: null },
        { status: 400 }
      )
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        company_id: currentUser.company_id,
        email: email.trim().toLowerCase(),
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { code: 400, message: '该邮箱已被使用', data: null },
        { status: 400 }
      )
    }

    // 默认密码
    const defaultPassword = 'password123'
    const hashedPassword = await hashPassword(defaultPassword)

    // 创建用户
    const newUser = await prisma.user.create({
      data: {
        company_id: currentUser.company_id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        password: hashedPassword,
        phone: phone?.trim() || null,
        role: role || 'user',
        dept_id: dept_id || null,
        status: status || 'active',
        created_by: currentUser.id,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    })

    // 移除密码字段
    const { password, ...userWithoutPassword } = newUser

    return NextResponse.json({
      code: 0,
      message: '用户创建成功，默认密码为: password123',
      data: userWithoutPassword,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
