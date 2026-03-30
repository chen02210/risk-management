import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// 监测频率映射
const frequencyMapping: Record<string, string> = {
  '每日': 'daily',
  '每周': 'weekly',
  '每月': 'monthly',
  '每季度': 'quarterly',
  '每年': 'yearly',
}

// 生成KRI编号
function generateKRINo(sequence: number): string {
  return `KRI-${String(sequence).padStart(4, '0')}`
}

// POST /api/kri/import - 批量导入KRI指标
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { data } = body

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { code: 400, message: '导入数据为空', data: null },
        { status: 400 }
      )
    }

    // 获取当前公司的部门列表
    const departments = await prisma.department.findMany({
      where: { company_id: user.company_id, deleted_at: null },
      select: { id: true, name: true },
    })

    // 创建部门名称到ID的映射
    const deptNameToId: Record<string, string> = {}
    departments.forEach((dept) => {
      deptNameToId[dept.name] = dept.id
    })

    // 获取当前KRI数量用于生成编号
    const count = await prisma.kRI.count({
      where: { company_id: user.company_id },
    })

    const results: { success: number; error: number; errors: string[] } = {
      success: 0,
      error: 0,
      errors: [],
    }

    // 处理每条数据
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 1

      try {
        // 验证必填字段
        if (!row['指标名称']) {
          throw new Error(`第${rowNum}行：指标名称为必填项`)
        }

        // 处理监测频率
        let frequency = 'monthly'
        if (row['监测频率']) {
          const freqKey = String(row['监测频率']).trim()
          if (frequencyMapping[freqKey]) {
            frequency = frequencyMapping[freqKey]
          } else {
            throw new Error(`第${rowNum}行：无效的监测频率"${freqKey}"，可选值：每日、每周、每月、每季度、每年`)
          }
        }

        // 处理责任部门
        let deptId: string | null = null
        if (row['责任部门']) {
          const deptName = String(row['责任部门']).trim()
          if (deptNameToId[deptName]) {
            deptId = deptNameToId[deptName]
          } else {
            throw new Error(`第${rowNum}行：部门"${deptName}"不存在，请先创建该部门`)
          }
        }

        // 解析数值字段
        const target = parseFloat(row['目标值']) || null
        const warningThreshold = parseFloat(row['黄色预警线']) || null
        const alertThreshold = parseFloat(row['红色警戒线']) || null

        // 验证阈值逻辑
        if (warningThreshold !== null && alertThreshold !== null && warningThreshold === alertThreshold) {
          throw new Error(`第${rowNum}行：黄色预警线和红色警戒线不能相同`)
        }

        // 生成KRI编号
        const kriNo = generateKRINo(count + i + 1)

        // 创建KRI
        await prisma.kRI.create({
          data: {
            company_id: user.company_id,
            kri_no: kriNo,
            name: String(row['指标名称']).trim(),
            linked_risk_no: row['关联风险编号'] ? String(row['关联风险编号']).trim() : null,
            description: row['指标说明'] ? String(row['指标说明']).trim() : null,
            formula: row['计算公式'] ? String(row['计算公式']).trim() : null,
            frequency,
            unit: row['单位'] ? String(row['单位']).trim() : null,
            target,
            warning_threshold: warningThreshold,
            alert_threshold: alertThreshold,
            dept_id: deptId,
            created_by: user.id,
          },
        })

        results.success++
      } catch (error) {
        results.error++
        if (error instanceof Error) {
          results.errors.push(error.message)
        } else {
          results.errors.push(`第${rowNum}行：未知错误`)
        }
      }
    }

    return NextResponse.json({
      code: 0,
      message: '导入完成',
      data: results,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Import KRI error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
