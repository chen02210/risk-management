import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    // 检查权限（仅管理员可导入）
    if (!['company_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { code: 403, message: '无权限导入部门', data: null },
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
    
    // 缓存已查找的部门名称到ID的映射
    const deptNameToIdMap: Record<string, string> = {}
    
    // 预加载当前公司所有部门到缓存
    const existingDepts = await prisma.department.findMany({
      where: { company_id: user.company_id, deleted_at: null },
      select: { id: true, name: true }
    })
    existingDepts.forEach(d => {
      deptNameToIdMap[d.name] = d.id
    })
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 1
      
      try {
        // 验证必填字段
        if (!row['部门名称'] || row['部门名称'].trim() === '') {
          results.errors.push(`第${rowNum}行：部门名称不能为空`)
          results.error++
          continue
        }
        
        const name = row['部门名称'].trim()
        const description = row['部门描述']?.trim() || null
        
        // 检查部门名称是否已存在
        if (deptNameToIdMap[name]) {
          results.errors.push(`第${rowNum}行：部门"${name}"已存在`)
          results.error++
          continue
        }
        
        // 处理上级部门
        let parentId: string | null = null
        if (row['上级部门'] && row['上级部门'].trim() !== '') {
          const parentName = row['上级部门'].trim()
          parentId = deptNameToIdMap[parentName] || null
          
          if (!parentId) {
            results.errors.push(`第${rowNum}行：上级部门"${parentName}"不存在`)
            results.error++
            continue
          }
        }
        
        // 创建部门
        const newDept = await prisma.department.create({
          data: {
            company_id: user.company_id,
            name: name,
            description: description,
            parent_id: parentId,
          }
        })
        
        // 更新缓存
        deptNameToIdMap[name] = newDept.id
        
        results.success++
      } catch (error) {
        results.errors.push(`第${rowNum}行：${error instanceof Error ? error.message : '未知错误'}`)
        results.error++
      }
    }

    return NextResponse.json({
      code: 0,
      message: '导入完成',
      data: results,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Import departments error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
