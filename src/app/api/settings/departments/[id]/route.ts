import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// PUT: 更新部门
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

    // 检查权限（仅管理员可更新）
    if (!['company_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { code: 403, message: '无权限更新部门', data: null },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { name, description, parent_id } = body

    // 检查部门是否存在
    const existingDept = await prisma.department.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingDept) {
      return NextResponse.json(
        { code: 404, message: '部门不存在', data: null },
        { status: 404 }
      )
    }

    // 检查名称是否与其他部门冲突
    if (name && name.trim() !== existingDept.name) {
      const nameConflict = await prisma.department.findFirst({
        where: {
          company_id: user.company_id,
          name: name.trim(),
          deleted_at: null,
          id: { not: id },
        },
      })

      if (nameConflict) {
        return NextResponse.json(
          { code: 400, message: '部门名称已存在', data: null },
          { status: 400 }
        )
      }
    }

    // 检查是否将自己设为父部门（循环引用）
    if (parent_id === id) {
      return NextResponse.json(
        { code: 400, message: '不能将部门设为自己的上级部门', data: null },
        { status: 400 }
      )
    }

    // 更新部门
    const updatedDept = await prisma.department.update({
      where: { id },
      data: {
        name: name?.trim() || existingDept.name,
        description: description !== undefined ? description?.trim() || null : existingDept.description,
        parent_id: parent_id !== undefined ? parent_id || null : existingDept.parent_id,
      },
      include: {
        parent: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      code: 0,
      message: '部门更新成功',
      data: updatedDept,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Update department error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// DELETE: 删除部门（软删除）
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

    // 检查权限（仅管理员可删除）
    if (!['company_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { code: 403, message: '无权限删除部门', data: null },
        { status: 403 }
      )
    }

    const { id } = params

    // 检查部门是否存在
    const existingDept = await prisma.department.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
      include: {
        _count: {
          select: { users: true, children: true },
        },
      },
    })

    if (!existingDept) {
      return NextResponse.json(
        { code: 404, message: '部门不存在', data: null },
        { status: 404 }
      )
    }

    // 检查是否有关联用户
    if (existingDept._count.users > 0) {
      return NextResponse.json(
        { code: 400, message: '该部门下存在用户，无法删除', data: null },
        { status: 400 }
      )
    }

    // 检查是否有子部门
    if (existingDept._count.children > 0) {
      return NextResponse.json(
        { code: 400, message: '该部门下有子部门，无法删除', data: null },
        { status: 400 }
      )
    }

    // 软删除部门
    await prisma.department.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    })

    return NextResponse.json({
      code: 0,
      message: '部门删除成功',
      data: null,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Delete department error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
