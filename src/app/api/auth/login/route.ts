import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // 查找用户
    const user = await prisma.user.findFirst({
      where: { email },
      include: { company: true },
    })

    if (!user) {
      return NextResponse.json(
        { code: 401, message: '邮箱或密码错误', data: null },
        { status: 401 }
      )
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { code: 401, message: '邮箱或密码错误', data: null },
        { status: 401 }
      )
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return NextResponse.json(
        { code: 403, message: '账户已被禁用', data: null },
        { status: 403 }
      )
    }

    // 生成 Token
    const token = generateToken({
      userId: user.id,
      companyId: user.company_id,
      role: user.role,
    })

    // 设置 Cookie
    await setAuthCookie(token)

    // 更新登录信息
    await prisma.user.update({
      where: { id: user.id },
      data: {
        last_login: new Date(),
        login_count: { increment: 1 },
        last_ip: request.ip || null,
      },
    })

    return NextResponse.json({
      code: 0,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.company_id,
          companyName: user.company.name,
        },
        token,
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
