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

    const { data } = await request.json()
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { code: 400, message: '数据不能为空', data: null },
        { status: 400 }
      )
    }

    const results = { success: 0, error: 0, errors: [] as string[] }
    
    // 检查结果映射
    const resultMap: Record<string, string> = {
      '合格': 'pass',
      '不合格': 'fail',
      '不适用': 'na',
    }
    
    // 获取当前检查数量用于生成编号
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    let baseCount = await prisma.riskCheck.count({
      where: { company_id: user.company_id },
    })

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 1
      
      try {
        // 验证必填字段
        if (!row['检查项目']) {
          results.errors.push(`第${rowNum}行：检查项目不能为空`)
          results.error++
          continue
        }
        
        if (!row['检查日期']) {
          results.errors.push(`第${rowNum}行：检查日期不能为空`)
          results.error++
          continue
        }
        
        if (!row['检查结果']) {
          results.errors.push(`第${rowNum}行：检查结果不能为空`)
          results.error++
          continue
        }
        
        // 解析检查结果
        const result = resultMap[row['检查结果']]
        if (!result) {
          results.errors.push(`第${rowNum}行：检查结果必须是"合格"、"不合格"或"不适用"`)
          results.error++
          continue
        }
        
        // 如果检查结果为不合格，需要验证问题描述和风险等级
        if (result === 'fail') {
          if (!row['问题描述']) {
            results.errors.push(`第${rowNum}行：不合格检查需要填写问题描述`)
            results.error++
            continue
          }
          if (!row['风险等级']) {
            results.errors.push(`第${rowNum}行：不合格检查需要填写风险等级`)
            results.error++
            continue
          }
        }
        
        // 验证风险等级
        const validRiskLevels = ['低', '中', '高', '极高']
        if (row['风险等级'] && !validRiskLevels.includes(row['风险等级'])) {
          results.errors.push(`第${rowNum}行：风险等级必须是"低"、"中"、"高"或"极高"`)
          results.error++
          continue
        }
        
        // 查找整改责任人
        let ownerId = null
        if (row['整改责任人']) {
          const owner = await prisma.user.findFirst({
            where: {
              company_id: user.company_id,
              name: row['整改责任人']
            }
          })
          if (owner) ownerId = owner.id
        }
        
        // 生成检查编号
        baseCount++
        const checkNo = `CHK-${year}${month}-${String(baseCount).padStart(4, '0')}`
        
        // 解析日期
        let checkDate: Date
        let deadline: Date | null = null
        
        try {
          checkDate = new Date(row['检查日期'])
          if (isNaN(checkDate.getTime())) {
            throw new Error('Invalid date')
          }
        } catch {
          results.errors.push(`第${rowNum}行：检查日期格式无效`)
          results.error++
          continue
        }
        
        if (row['整改期限']) {
          try {
            deadline = new Date(row['整改期限'])
            if (isNaN(deadline.getTime())) {
              deadline = null
            }
          } catch {
            deadline = null
          }
        }
        
        // 创建检查记录
        await prisma.riskCheck.create({
          data: {
            company_id: user.company_id,
            check_no: checkNo,
            area: row['检查区域'] || null,
            category: row['风险类别'] || null,
            check_item: row['检查项目'],
            standard: row['检查标准'] || null,
            method: row['检查方法'] || null,
            check_date: checkDate,
            checker: row['检查人'] || null,
            result: result,
            issue_desc: row['问题描述'] || null,
            risk_level: row['风险等级'] || null,
            measure: row['整改措施'] || null,
            owner_id: ownerId,
            deadline: deadline,
            created_by: user.id,
          }
        })
        
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
    console.error('Import checks error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
