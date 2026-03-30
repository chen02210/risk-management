import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { calculateSupplierScore, calculateSupplierRiskLevel, generateSupplierNo } from '@/lib/utils'

// GET /api/suppliers - 获取供应商列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const riskLevel = searchParams.get('risk_level')
    const status = searchParams.get('status')
    const category = searchParams.get('supply_category')
    const search = searchParams.get('search')
    const expiringSoon = searchParams.get('expiring_soon') === 'true'

    const where: Record<string, unknown> = {
      company_id: user.company_id,
      deleted_at: null,
    }

    if (riskLevel) where.risk_level = riskLevel
    if (status) where.status = status
    if (category) where.supply_category = category
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { supplier_no: { contains: search, mode: 'insensitive' } },
        { supply_items: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    // 协议即将到期筛选（30天内）
    if (expiringSoon) {
      const today = new Date()
      const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      where.has_agreement = true
      where.agreement_expire = {
        gte: today,
        lte: thirtyDaysLater,
      }
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { created_at: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ])

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        list: suppliers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get suppliers error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// POST /api/suppliers - 创建供应商
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
    const {
      name,
      supplier_no,
      supply_category,
      supply_items,
      supply_share,
      cooperation_years,
      replaceability,
      on_time_rate,
      quality_rate,
      price_competitiveness,
      financial_stability,
      service_cooperation,
      has_agreement,
      agreement_expire,
      improvement_require,
    } = body

    // 计算综合得分
    const totalScore = calculateSupplierScore({
      on_time_rate,
      quality_rate,
      price_competitiveness,
      financial_stability,
      service_cooperation,
    })

    // 计算风险等级
    const riskLevel = calculateSupplierRiskLevel(totalScore)

    // 生成供应商编号
    const count = await prisma.supplier.count({
      where: { company_id: user.company_id },
    })
    const finalSupplierNo = supplier_no || generateSupplierNo(count + 1)

    const supplier = await prisma.supplier.create({
      data: {
        company_id: user.company_id,
        supplier_no: finalSupplierNo,
        name,
        supply_category,
        supply_items,
        supply_share: supply_share ? Number(supply_share) : null,
        cooperation_years: cooperation_years ? Number(cooperation_years) : null,
        replaceability: replaceability ? Number(replaceability) : null,
        on_time_rate: on_time_rate ? Number(on_time_rate) : null,
        quality_rate: quality_rate ? Number(quality_rate) : null,
        price_competitiveness: price_competitiveness ? Number(price_competitiveness) : null,
        financial_stability: financial_stability ? Number(financial_stability) : null,
        service_cooperation: service_cooperation ? Number(service_cooperation) : null,
        total_score: totalScore,
        risk_level: riskLevel,
        has_agreement: has_agreement || false,
        agreement_expire: agreement_expire ? new Date(agreement_expire) : null,
        improvement_require,
        evaluator: user.name,
        evaluate_date: new Date(),
        created_by: user.id,
      },
    })

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: supplier,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Create supplier error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
