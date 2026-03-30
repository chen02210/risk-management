import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { calculateSupplierScore, calculateSupplierRiskLevel, generateSupplierNo } from '@/lib/utils'

// POST /api/suppliers/import - 批量导入供应商
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

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { code: 400, message: '导入数据不能为空', data: null },
        { status: 400 }
      )
    }

    // 获取当前供应商数量用于生成编号
    const count = await prisma.supplier.count({
      where: { company_id: user.company_id },
    })

    const results = {
      success: 0,
      error: 0,
      errors: [] as string[],
    }

    // 获取当前用户信息作为默认评估人
    const evaluator = user.name || '系统导入'
    const evaluateDate = new Date()

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 1

      try {
        // 解析Excel数据
        const name = row['供应商名称']?.toString().trim()
        const supplyCategory = row['供应物料类别']?.toString().trim() || ''
        const supplyItems = row['具体供应品种']?.toString().trim() || ''
        const supplyShare = parseFloat(row['供应份额(%)']) || null
        const cooperationYears = parseInt(row['合作年限']) || null
        const onTimeRate = parseFloat(row['交期达成率(%)']) || null
        const qualityRate = parseFloat(row['质量合格率(%)']) || null
        const priceCompetitiveness = parseInt(row['价格竞争力(1-5)']) || null
        const financialStability = parseInt(row['财务稳健性(1-5)']) || null
        const serviceCooperation = parseInt(row['服务配合度(1-5)']) || null
        const hasAgreementText = row['有框架协议']?.toString().trim()
        const agreementExpire = row['协议到期日']?.toString().trim() || null
        const evaluatorName = row['评估人']?.toString().trim() || evaluator

        // 验证必填项
        if (!name) {
          results.error++
          results.errors.push(`第${rowNum}行：供应商名称不能为空`)
          continue
        }

        // 解析有框架协议字段
        let hasAgreement = false
        if (hasAgreementText) {
          const text = hasAgreementText.toLowerCase()
          hasAgreement = text === '是' || text === 'yes' || text === 'true' || text === '1'
        }

        // 解析协议到期日
        let agreementExpireDate: Date | null = null
        if (agreementExpire) {
          // 尝试解析日期（支持多种格式）
          const dateMatch = agreementExpire.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
          if (dateMatch) {
            agreementExpireDate = new Date(
              parseInt(dateMatch[1]),
              parseInt(dateMatch[2]) - 1,
              parseInt(dateMatch[3])
            )
          } else {
            // 尝试Excel序列号格式
            const excelDate = parseFloat(agreementExpire)
            if (!isNaN(excelDate) && excelDate > 30000) {
              // Excel日期是从1900年1月1日开始计算的
              agreementExpireDate = new Date((excelDate - 25569) * 86400 * 1000)
            }
          }
        }

        // 计算综合得分
        const totalScore = calculateSupplierScore({
          on_time_rate: onTimeRate,
          quality_rate: qualityRate,
          price_competitiveness: priceCompetitiveness,
          financial_stability: financialStability,
          service_cooperation: serviceCooperation,
        })

        // 计算风险等级
        const riskLevel = calculateSupplierRiskLevel(totalScore)

        // 生成供应商编号
        const supplierNo = generateSupplierNo(count + i + 1)

        // 创建供应商
        await prisma.supplier.create({
          data: {
            company_id: user.company_id,
            supplier_no: supplierNo,
            name,
            supply_category: supplyCategory || null,
            supply_items: supplyItems || null,
            supply_share: supplyShare,
            cooperation_years: cooperationYears,
            replaceability: null,
            on_time_rate: onTimeRate,
            quality_rate: qualityRate,
            price_competitiveness: priceCompetitiveness,
            financial_stability: financialStability,
            service_cooperation: serviceCooperation,
            total_score: totalScore,
            risk_level: riskLevel,
            has_agreement: hasAgreement,
            agreement_expire: agreementExpireDate,
            improvement_require: null,
            evaluator: evaluatorName,
            evaluate_date: evaluateDate,
            created_by: user.id,
            status: 'active',
          },
        })

        results.success++
      } catch (error) {
        results.error++
        results.errors.push(`第${rowNum}行：${error instanceof Error ? error.message : '未知错误'}`)
      }
    }

    return NextResponse.json({
      code: 0,
      message: '导入完成',
      data: results,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Import suppliers error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
