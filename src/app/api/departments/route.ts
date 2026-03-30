import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const departments = await prisma.department.findMany({
      where: {
        company_id: user.company_id,
        deleted_at: null,
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
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
