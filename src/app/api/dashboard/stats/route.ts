import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const companyId = user.company_id

    // 并行查询各项统计数据
    const [
      totalRisks,
      risksByLevel,
      risksByCategory,
      pendingMeasures,
      kriAlertCount,
      recentRisks,
    ] = await Promise.all([
      // 风险总数
      prisma.risk.count({
        where: { company_id: companyId, deleted_at: null },
      }),

      // 按等级统计
      prisma.risk.groupBy({
        by: ['risk_level'],
        where: { company_id: companyId, deleted_at: null },
        _count: { risk_level: true },
      }),

      // 按类别统计
      prisma.risk.groupBy({
        by: ['category'],
        where: { company_id: companyId, deleted_at: null },
        _count: { category: true },
      }),

      // 待办措施
      prisma.riskMeasure.count({
        where: {
          company_id: companyId,
          status: { in: ['pending', 'in_progress'] },
          deleted_at: null,
        },
      }),

      // KRI预警数
      prisma.kRIMonthlyData.count({
        where: {
          company_id: companyId,
          status: 'alert',
        },
      }),

      // 最新风险
      prisma.risk.findMany({
        where: { company_id: companyId, deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
          id: true,
          risk_no: true,
          name: true,
          risk_level: true,
          created_at: true,
        },
      }),
    ])

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        totalRisks,
        risksByLevel: risksByLevel.map(r => ({
          level: r.risk_level,
          count: r._count.risk_level,
        })),
        risksByCategory: risksByCategory.map(r => ({
          category: r.category,
          count: r._count.category,
        })),
        pendingMeasures,
        kriAlertCount,
        recentRisks,
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
