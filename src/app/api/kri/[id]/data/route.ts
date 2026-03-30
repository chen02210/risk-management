import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/kri/[id]/data - 获取KRI历史数据
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '12')

    // 检查KRI是否存在
    const kri = await prisma.kRI.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!kri) {
      return NextResponse.json(
        { code: 404, message: 'KRI指标不存在', data: null },
        { status: 404 }
      )
    }

    // 获取历史数据
    const data = await prisma.kRIMonthlyData.findMany({
      where: {
        kri_id: id,
        company_id: user.company_id,
      },
      orderBy: { month: 'desc' },
      take: months,
    })

    // 按月份升序排列（便于图表展示）
    const sortedData = data.sort((a: { month: string }, b: { month: string }) => a.month.localeCompare(b.month))

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        kri_id: id,
        kri_name: kri.name,
        unit: kri.unit,
        target: kri.target,
        warning_threshold: kri.warning_threshold,
        alert_threshold: kri.alert_threshold,
        data: sortedData,
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get KRI data error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// POST /api/kri/[id]/data - 录入月度数据
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { month, value, notes } = body

    // 验证必填字段
    if (!month || value === undefined) {
      return NextResponse.json(
        { code: 400, message: '月份和数值为必填项', data: null },
        { status: 400 }
      )
    }

    // 验证月份格式 (YYYY-MM)
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/
    if (!monthRegex.test(month)) {
      return NextResponse.json(
        { code: 400, message: '月份格式不正确，应为 YYYY-MM', data: null },
        { status: 400 }
      )
    }

    // 检查KRI是否存在
    const kri = await prisma.kRI.findFirst({
      where: {
        id,
        company_id: user.company_id,
        deleted_at: null,
      },
    })

    if (!kri) {
      return NextResponse.json(
        { code: 404, message: 'KRI指标不存在', data: null },
        { status: 404 }
      )
    }

    // 计算趋势和状态
    const val = parseFloat(value)
    let trend: 'up' | 'down' | 'stable' = 'stable'
    let status: 'normal' | 'warning' | 'alert' = 'normal'

    // 获取上一个月的数据用于计算趋势
    const prevData = await prisma.kRIMonthlyData.findFirst({
      where: {
        kri_id: id,
        month: { lt: month },
      },
      orderBy: { month: 'desc' },
    })

    if (prevData) {
      const prevVal = parseFloat(prevData.value.toString())
      const diff = Math.abs(val - prevVal)
      const diffPercent = prevVal !== 0 ? diff / Math.abs(prevVal) : 0
      
      if (diffPercent > 0.05) {
        trend = val > prevVal ? 'up' : 'down'
      } else {
        trend = 'stable'
      }
    }

    // 计算状态
    if (kri.alert_threshold !== null && kri.warning_threshold !== null) {
      const alertVal = parseFloat(kri.alert_threshold.toString())
      const warnVal = parseFloat(kri.warning_threshold.toString())
      const targetVal = kri.target !== null ? parseFloat(kri.target.toString()) : null

      // 判断阈值模式：
      // 如果 alert > warning，则是越大越危险（如事故率）
      // 如果 alert < warning，则是越小越危险（如合格率）
      // targetVal可用于更复杂的阈值判断
      void targetVal // 标记为已使用
      if (alertVal > warnVal) {
        // 越大越危险模式
        if (val >= alertVal) {
          status = 'alert'
        } else if (val >= warnVal) {
          status = 'warning'
        } else {
          status = 'normal'
        }
      } else {
        // 越小越危险模式
        if (val <= alertVal) {
          status = 'alert'
        } else if (val <= warnVal) {
          status = 'warning'
        } else {
          status = 'normal'
        }
      }
    }

    // 检查是否已存在该月的数据
    const existingData = await prisma.kRIMonthlyData.findUnique({
      where: {
        kri_id_month: {
          kri_id: id,
          month,
        },
      },
    })

    let monthlyData
    if (existingData) {
      // 更新现有数据
      monthlyData = await prisma.kRIMonthlyData.update({
        where: {
          kri_id_month: {
            kri_id: id,
            month,
          },
        },
        data: {
          value: val,
          trend,
          status,
          notes: notes || null,
          updated_at: new Date(),
        },
      })
    } else {
      // 创建新数据
      monthlyData = await prisma.kRIMonthlyData.create({
        data: {
          kri_id: id,
          company_id: user.company_id,
          month,
          value: val,
          trend,
          status,
          notes: notes || null,
          created_by: user.id,
        },
      })
    }

    return NextResponse.json({
      code: 0,
      message: existingData ? '更新成功' : '录入成功',
      data: monthlyData,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Create/Update KRI data error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}

// DELETE /api/kri/[id]/data - 删除月度数据
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权', data: null },
        { status: 401 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    if (!month) {
      return NextResponse.json(
        { code: 400, message: '月份参数为必填项', data: null },
        { status: 400 }
      )
    }

    // 检查数据是否存在
    const existingData = await prisma.kRIMonthlyData.findUnique({
      where: {
        kri_id_month: {
          kri_id: id,
          month,
        },
      },
    })

    if (!existingData) {
      return NextResponse.json(
        { code: 404, message: '月度数据不存在', data: null },
        { status: 404 }
      )
    }

    await prisma.kRIMonthlyData.delete({
      where: {
        kri_id_month: {
          kri_id: id,
          month,
        },
      },
    })

    return NextResponse.json({
      code: 0,
      message: '删除成功',
      data: null,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Delete KRI data error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
