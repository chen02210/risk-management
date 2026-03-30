import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { calculateSupplierScore, calculateSupplierRiskLevel } from '@/lib/utils'

// GET /api/suppliers/[id] - 获取单个供应商
export async function GET(
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

    const { id } = params

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { code: 404, message: '供应商不存在', data: null },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: supplier,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get supplier error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// PUT /api/suppliers/[id] - 更新供应商
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

    const { id } = params
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
      status,
    } = body

    // 检查供应商是否存在
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingSupplier) {
      return NextResponse.json(
        { code: 404, message: '供应商不存在', data: null },
        { status: 404 }
      )
    }

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

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        supplier_no,
        supply_category,
        supply_items,
        supply_share: supply_share !== undefined ? Number(supply_share) : undefined,
        cooperation_years: cooperation_years !== undefined ? Number(cooperation_years) : undefined,
        replaceability: replaceability !== undefined ? Number(replaceability) : undefined,
        on_time_rate: on_time_rate !== undefined ? Number(on_time_rate) : undefined,
        quality_rate: quality_rate !== undefined ? Number(quality_rate) : undefined,
        price_competitiveness: price_competitiveness !== undefined ? Number(price_competitiveness) : undefined,
        financial_stability: financial_stability !== undefined ? Number(financial_stability) : undefined,
        service_cooperation: service_cooperation !== undefined ? Number(service_cooperation) : undefined,
        total_score: totalScore,
        risk_level: riskLevel,
        has_agreement: has_agreement !== undefined ? has_agreement : undefined,
        agreement_expire: agreement_expire !== undefined 
          ? (agreement_expire ? new Date(agreement_expire) : null) 
          : undefined,
        improvement_require,
        status,
        evaluator: user.name,
        evaluate_date: new Date(),
      },
    })

    return NextResponse.json({
      code: 0,
      message: '更新成功',
      data: supplier,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Update supplier error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// DELETE /api/suppliers/[id] - 删除供应商（软删除）
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

    const { id } = params

    // 检查供应商是否存在
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingSupplier) {
      return NextResponse.json(
        { code: 404, message: '供应商不存在', data: null },
        { status: 404 }
      )
    }

    await prisma.supplier.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    })

    return NextResponse.json({
      code: 0,
      message: '删除成功',
      data: null,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Delete supplier error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// PATCH /api/suppliers/[id] - 部分更新供应商（如只更新评估指标）
export async function PATCH(
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

    const { id } = params
    const body = await request.json()

    // 检查供应商是否存在
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!existingSupplier) {
      return NextResponse.json(
        { code: 404, message: '供应商不存在', data: null },
        { status: 404 }
      )
    }

    // 如果更新了评估指标，重新计算得分
    let totalScore = existingSupplier.total_score
    let riskLevel = existingSupplier.risk_level

    if (body.on_time_rate !== undefined || 
        body.quality_rate !== undefined || 
        body.price_competitiveness !== undefined ||
        body.financial_stability !== undefined ||
        body.service_cooperation !== undefined) {
      
      const onTimeRate = body.on_time_rate !== undefined ? Number(body.on_time_rate) : existingSupplier.on_time_rate
      const qualityRate = body.quality_rate !== undefined ? Number(body.quality_rate) : existingSupplier.quality_rate
      const priceCompetitiveness = body.price_competitiveness !== undefined ? Number(body.price_competitiveness) : existingSupplier.price_competitiveness
      const financialStability = body.financial_stability !== undefined ? Number(body.financial_stability) : existingSupplier.financial_stability
      const serviceCooperation = body.service_cooperation !== undefined ? Number(body.service_cooperation) : existingSupplier.service_cooperation

      totalScore = calculateSupplierScore({
        on_time_rate: onTimeRate,
        quality_rate: qualityRate,
        price_competitiveness: priceCompetitiveness,
        financial_stability: financialStability,
        service_cooperation: serviceCooperation,
      })
      riskLevel = calculateSupplierRiskLevel(totalScore)
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...body,
        total_score: totalScore,
        risk_level: riskLevel,
        evaluator: user.name,
        evaluate_date: new Date(),
        agreement_expire: body.agreement_expire !== undefined 
          ? (body.agreement_expire ? new Date(body.agreement_expire) : null) 
          : undefined,
      },
    })

    return NextResponse.json({
      code: 0,
      message: '更新成功',
      data: supplier,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Patch supplier error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
