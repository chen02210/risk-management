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
    
    // 状态映射
    const statusMap: Record<string, string> = {
      '待开始': 'pending',
      '进行中': 'in_progress',
      '已完成': 'completed',
      '已延期': 'delayed',
      '已取消': 'cancelled',
    }
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 1
      
      try {
        // 验证必填字段
        if (!row['关联风险编号']) {
          results.errors.push(`第${rowNum}行：关联风险编号不能为空`)
          results.error++
          continue
        }
        
        if (!row['措施描述']) {
          results.errors.push(`第${rowNum}行：措施描述不能为空`)
          results.error++
          continue
        }
        
        // 查找风险
        const risk = await prisma.risk.findFirst({
          where: {
            company_id: user.company_id,
            risk_no: row['关联风险编号'],
            deleted_at: null,
          },
        })
        
        if (!risk) {
          results.errors.push(`第${rowNum}行：风险编号 "${row['关联风险编号']}" 不存在`)
          results.error++
          continue
        }
        
        // 查找部门
        let deptId = null
        if (row['责任部门']) {
          const dept = await prisma.department.findFirst({
            where: {
              company_id: user.company_id,
              name: row['责任部门'],
            },
          })
          if (dept) {
            deptId = dept.id
          }
        }
        
        // 查找责任人
        let ownerId = null
        if (row['责任人']) {
          const owner = await prisma.user.findFirst({
            where: {
              company_id: user.company_id,
              name: row['责任人'],
            },
          })
          if (owner) {
            ownerId = owner.id
          }
        }
        
        // 解析状态
        const status = statusMap[row['状态']] || 'pending'
        
        // 解析日期
        let startDate = null
        let planDate = null
        
        if (row['开始日期']) {
          try {
            startDate = new Date(row['开始日期'])
            if (isNaN(startDate.getTime())) {
              startDate = null
            }
          } catch {
            startDate = null
          }
        }
        
        if (row['计划完成日期']) {
          try {
            planDate = new Date(row['计划完成日期'])
            if (isNaN(planDate.getTime())) {
              planDate = null
            }
          } catch {
            planDate = null
          }
        }
        
        // 解析预算
        const budget = row['预算(万元)'] ? parseFloat(String(row['预算(万元)'])) : null
        
        // 生成措施编号
        const count = await prisma.riskMeasure.count({
          where: { risk_id: risk.id },
        })
        const measureNo = count + 1
        
        // 创建措施
        await prisma.riskMeasure.create({
          data: {
            company_id: user.company_id,
            risk_id: risk.id,
            measure_no: measureNo,
            description: row['措施描述'],
            dept_id: deptId,
            owner_id: ownerId,
            start_date: startDate,
            plan_date: planDate,
            budget: budget,
            status: status as any,
            created_by: user.id,
          },
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
    console.error('Import measures error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
