import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/training/stats - 获取培训统计数据
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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // 获取年度培训数据
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31, 23, 59, 59)

    const trainings = await prisma.training.findMany({
      where: {
        company_id: user.company_id,
        deleted_at: null,
        training_date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    })

    // 计算总体统计数据
    const totalTrainings = trainings.length
    const totalPersonTimes = trainings.reduce((sum, t) => sum + (t.actual_count || 0), 0)
    const totalPlanCount = trainings.reduce((sum, t) => sum + (t.plan_count || 0), 0)
    const totalHours = trainings.reduce((sum, t) => sum + Number(t.hours || 0), 0)
    
    // 计算平均通过率
    const trainingsWithPassRate = trainings.filter(t => t.pass_rate !== null)
    const avgPassRate = trainingsWithPassRate.length > 0
      ? trainingsWithPassRate.reduce((sum, t) => sum + Number(t.pass_rate || 0), 0) / trainingsWithPassRate.length
      : 0

    // 计算平均培训效果评分
    const trainingsWithEffectScore = trainings.filter(t => t.effect_score !== null)
    const avgEffectScore = trainingsWithEffectScore.length > 0
      ? trainingsWithEffectScore.reduce((sum, t) => sum + Number(t.effect_score || 0), 0) / trainingsWithEffectScore.length
      : 0

    // 按季度统计
    const quarterStats = [
      { quarter: 'Q1', months: [0, 1, 2] },
      { quarter: 'Q2', months: [3, 4, 5] },
      { quarter: 'Q3', months: [6, 7, 8] },
      { quarter: 'Q4', months: [9, 10, 11] },
    ].map(q => {
      const quarterTrainings = trainings.filter(t => {
        const month = new Date(t.training_date).getMonth()
        return q.months.includes(month)
      })

      const quarterPersonTimes = quarterTrainings.reduce((sum, t) => sum + (t.actual_count || 0), 0)
      const quarterHours = quarterTrainings.reduce((sum, t) => sum + Number(t.hours || 0), 0)
      
      const quarterPassRates = quarterTrainings.filter(t => t.pass_rate !== null)
      const quarterAvgPassRate = quarterPassRates.length > 0
        ? quarterPassRates.reduce((sum, t) => sum + Number(t.pass_rate || 0), 0) / quarterPassRates.length
        : null

      const quarterEffectScores = quarterTrainings.filter(t => t.effect_score !== null)
      const quarterAvgEffectScore = quarterEffectScores.length > 0
        ? quarterEffectScores.reduce((sum, t) => sum + Number(t.effect_score || 0), 0) / quarterEffectScores.length
        : null

      return {
        quarter: q.quarter,
        count: quarterTrainings.length,
        person_times: quarterPersonTimes,
        hours: quarterHours,
        avg_pass_rate: quarterAvgPassRate,
        avg_effect_score: quarterAvgEffectScore,
      }
    })

    // 按类别统计
    const categoryStats = trainings.reduce((acc, t) => {
      const category = t.category || '未分类'
      if (!acc[category]) {
        acc[category] = { count: 0, person_times: 0, hours: 0 }
      }
      acc[category].count += 1
      acc[category].person_times += (t.actual_count || 0)
      acc[category].hours += Number(t.hours || 0)
      return acc
    }, {} as Record<string, { count: number; person_times: number; hours: number }>)

    // 按培训方式统计
    const methodStats = trainings.reduce((acc, t) => {
      const method = t.method || '未指定'
      if (!acc[method]) {
        acc[method] = { count: 0, person_times: 0 }
      }
      acc[method].count += 1
      acc[method].person_times += (t.actual_count || 0)
      return acc
    }, {} as Record<string, { count: number; person_times: number }>)

    // 按讲师来源统计
    const instructorStats = trainings.reduce((acc, t) => {
      const source = t.instructor_source || '未指定'
      if (!acc[source]) {
        acc[source] = { count: 0, person_times: 0 }
      }
      acc[source].count += 1
      acc[source].person_times += (t.actual_count || 0)
      return acc
    }, {} as Record<string, { count: number; person_times: number }>)

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        year,
        summary: {
          total_trainings: totalTrainings,
          total_person_times: totalPersonTimes,
          total_plan_count: totalPlanCount,
          total_hours: totalHours,
          avg_pass_rate: Math.round(avgPassRate * 100) / 100,
          avg_effect_score: Math.round(avgEffectScore * 100) / 100,
          attendance_rate: totalPlanCount > 0 
            ? Math.round((totalPersonTimes / totalPlanCount) * 10000) / 100 
            : 0,
        },
        quarter_stats: quarterStats,
        category_stats: categoryStats,
        method_stats: methodStats,
        instructor_stats: instructorStats,
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get training stats error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
