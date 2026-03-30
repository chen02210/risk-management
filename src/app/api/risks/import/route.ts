import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { calculateRiskLevel, generateRiskNo } from '@/lib/utils'

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
    
    // 获取当前公司该类别下的最大序号
    const categoryCount: Record<string, number> = {}
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 1
      
      try {
        // 验证必填字段
        if (!row['风险名称']) {
          results.errors.push(`第${rowNum}行：风险名称不能为空`)
          results.error++
          continue
        }
        
        // 解析类别
        const categoryMap: Record<string, string> = {
          '安全环保': 'safety',
          '生产运营': 'production',
          '质量': 'quality',
          '供应链': 'supply_chain',
          '财务': 'financial',
          '合规': 'compliance',
          '信息安全': 'information',
        }
        const category = categoryMap[row['风险类别']] || 'safety'
        
        // 解析可能性和影响度
        const likelihood = parseInt(row['可能性(1-5)']) || 3
        const impact = parseInt(row['影响度(1-5)']) || 3
        
        if (likelihood < 1 || likelihood > 5 || impact < 1 || impact > 5) {
          results.errors.push(`第${rowNum}行：可能性和影响度必须在1-5之间`)
          results.error++
          continue
        }
        
        // 计算风险值和等级
        const riskValue = likelihood * impact
        const riskLevel = calculateRiskLevel(riskValue)
        
        // 生成风险编号
        if (!categoryCount[category]) {
          const count = await prisma.risk.count({
            where: { company_id: user.company_id, category },
          })
          categoryCount[category] = count
        }
        categoryCount[category]++
        const riskNo = generateRiskNo(category, categoryCount[category])
        
        // 解析应对策略
        const strategyMap: Record<string, string> = {
          '规避': 'avoid',
          '降低': 'reduce',
          '转移': 'transfer',
          '接受': 'accept',
        }
        
        // 查找部门和负责人
        let deptId = null
        let ownerId = null
        
        if (row['责任部门']) {
          const dept = await prisma.department.findFirst({
            where: { 
              company_id: user.company_id,
              name: row['责任部门']
            }
          })
          if (dept) deptId = dept.id
        }
        
        if (row['责任人']) {
          const owner = await prisma.user.findFirst({
            where: {
              company_id: user.company_id,
              name: row['责任人']
            }
          })
          if (owner) ownerId = owner.id
        }
        
        // 创建风险
        await prisma.risk.create({
          data: {
            company_id: user.company_id,
            risk_no: riskNo,
            name: row['风险名称'],
            category: category as any,
            description: row['风险描述'] || null,
            consequence: row['潜在后果'] || null,
            source: row['风险来源'] || null,
            likelihood,
            impact,
            risk_value: riskValue,
            risk_level: riskLevel,
            response_strategy: strategyMap[row['应对策略']] as any,
            dept_id: deptId,
            owner_id: ownerId,
            next_evaluate_at: row['下次评估日期'] ? new Date(row['下次评估日期']) : null,
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
    console.error('Import risks error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
