import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword } from '@/lib/auth'

// PUT: 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const { id } = params

    // 检查权限
    const isSelf = currentUser.id === id
    const isAdmin = ['company_admin', 'super_admin'].includes(currentUser.role)

    // 普通用户只能修改自己，管理员可以修改所有人
    if (!isSelf && !isAdmin) {
      return NextResponse.json(
        { code: 403, message: '无权限更新用户', data: null },
        { status: 403 }
      )
    }

    // 检查用户是否存在
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        company_id: currentUser.company_id,
        deleted_at: null,
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        { code: 404, message: '用户不存在', data: null },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, phone, role, dept_id, status, password } = body

    // 普通用户不能修改角色和状态
    if (!isAdmin && (role !== undefined || status !== undefined)) {
      return NextResponse.json(
        { code: 403, message: '无权限修改角色或状态', data: null },
        { status: 403 }
      )
    }

    // 检查角色权限（管理员不能给自己降级，除非是超管）
    if (role && isAdmin && id === currentUser.id && currentUser.role === 'company_admin' && role !== 'company_admin') {
      // 检查是否还有其他公司管理员
      const otherAdmins = await prisma.user.count({
        where: {
          company_id: currentUser.company_id,
          role: 'company_admin',
          deleted_at: null,
          id: { not: currentUser.id },
        },
      })

      if (otherAdmins === 0) {
        return NextResponse.json(
          { code: 400, message: '至少需要保留一个公司管理员', data: null },
          { status: 400 }
        )
      }
    }

    // 构建更新数据
    const updateData: any = {}

    if (name !== undefined) updateData.name = name.trim()
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (dept_id !== undefined) updateData.dept_id = dept_id || null
    if (isAdmin && role !== undefined) updateData.role = role
    if (isAdmin && status !== undefined) updateData.status = status

    // 更新密码
    if (password && password.trim() !== '') {
      updateData.password = await hashPassword(password.trim())
    }

    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        department: { select: { id: true, name: true } },
      },
    })

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      code: 0,
      message: '用户更新成功',
      data: userWithoutPassword,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// DELETE: 删除用户（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    // 检查权限（仅管理员可删除）
    if (!['company_admin', 'super_admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { code: 403, message: '无权限删除用户', data: null },
        { status: 403 }
      )
    }

    const { id } = params

    // 不能删除自己
    if (id === currentUser.id) {
      return NextResponse.json(
        { code: 400, message: '不能删除当前登录用户', data: null },
        { status: 400 }
      )
    }

    // 检查用户是否存在
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        company_id: currentUser.company_id,
        deleted_at: null,
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        { code: 404, message: '用户不存在', data: null },
        { status: 404 }
      )
    }

    // 不能删除超级管理员（除非是超管自己）
    if (existingUser.role === 'super_admin' && currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { code: 403, message: '无权限删除超级管理员', data: null },
        { status: 403 }
      )
    }

    // 软删除用户
    await prisma.user.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        status: 'inactive',
      },
    })

    return NextResponse.json({
      code: 0,
      message: '用户删除成功',
      data: null,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
