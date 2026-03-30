import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    // 检查权限（仅管理员可导入）
    if (!['company_admin', 'super_admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { code: 403, message: '无权限导入用户', data: null },
        { status: 403 }
      )
    }

    const { data } = await request.json()
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { code: 400, message: '数据不能为空', data: null },
        { status: 400 }
      )
    }

    const results = { success: 0, error: 0, errors: [] as string[] }
    
    // 角色映射表
    const roleMap: Record<string, string> = {
      '公司管理员': 'company_admin',
      '部门管理员': 'dept_admin',
      '普通用户': 'user',
      '只读用户': 'readonly',
    }
    
    // 缓存部门名称到ID的映射
    const deptNameToIdMap: Record<string, string> = {}
    
    // 预加载当前公司所有部门到缓存
    const departments = await prisma.department.findMany({
      where: { company_id: currentUser.company_id, deleted_at: null },
      select: { id: true, name: true }
    })
    departments.forEach(d => {
      deptNameToIdMap[d.name] = d.id
    })
    
    // 预加载已存在的邮箱
    const existingEmails = new Set(
      (await prisma.user.findMany({
        where: { company_id: currentUser.company_id },
        select: { email: true }
      })).map(u => u.email.toLowerCase())
    )
    
    // 默认密码
    const defaultPassword = 'password123'
    const hashedPassword = await hashPassword(defaultPassword)
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 1
      
      try {
        // 验证必填字段
        if (!row['姓名'] || row['姓名'].trim() === '') {
          results.errors.push(`第${rowNum}行：姓名不能为空`)
          results.error++
          continue
        }
        
        if (!row['邮箱'] || row['邮箱'].trim() === '') {
          results.errors.push(`第${rowNum}行：邮箱不能为空`)
          results.error++
          continue
        }
        
        const name = row['姓名'].trim()
        const email = row['邮箱'].trim().toLowerCase()
        const phone = row['手机号']?.trim() || null
        
        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          results.errors.push(`第${rowNum}行：邮箱格式不正确`)
          results.error++
          continue
        }
        
        // 检查邮箱是否已存在
        if (existingEmails.has(email)) {
          results.errors.push(`第${rowNum}行：邮箱"${email}"已被使用`)
          results.error++
          continue
        }
        
        // 解析角色
        let role = 'user' // 默认普通用户
        if (row['角色'] && row['角色'].trim() !== '') {
          const roleLabel = row['角色'].trim()
          if (roleMap[roleLabel]) {
            role = roleMap[roleLabel]
          } else {
            results.errors.push(`第${rowNum}行：角色"${roleLabel}"无效，可选值：公司管理员、部门管理员、普通用户、只读用户`)
            results.error++
            continue
          }
        }
        
        // 处理部门
        let deptId: string | null = null
        if (row['部门'] && row['部门'].trim() !== '') {
          const deptName = row['部门'].trim()
          deptId = deptNameToIdMap[deptName] || null
          
          if (!deptId) {
            results.errors.push(`第${rowNum}行：部门"${deptName}"不存在`)
            results.error++
            continue
          }
        }
        
        // 创建用户
        await prisma.user.create({
          data: {
            company_id: currentUser.company_id,
            email: email,
            name: name,
            password: hashedPassword,
            phone: phone,
            role: role,
            dept_id: deptId,
            status: 'active',
            created_by: currentUser.id,
          }
        })
        
        // 添加到已存在邮箱集合
        existingEmails.add(email)
        
        results.success++
      } catch (error) {
        results.errors.push(`第${rowNum}行：${error instanceof Error ? error.message : '未知错误'}`)
        results.error++
      }
    }

    return NextResponse.json({
      code: 0,
      message: '导入完成，默认密码为: password123',
      data: results,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Import users error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
