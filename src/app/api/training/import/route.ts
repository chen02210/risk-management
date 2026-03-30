import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateTrainingNo } from '@/lib/utils'

// 中文到数据库字段的映射
const categoryMapping: Record<string, string> = {
  '安全培训': 'safety',
  '质量培训': 'quality',
  '技能培训': 'skill',
  '管理培训': 'management',
  '合规培训': 'compliance',
}

const levelMapping: Record<string, string> = {
  '公司级': 'company',
  '部门级': 'dept',
  '班组级': 'team',
}

const instructorSourceMapping: Record<string, string> = {
  '内部': 'internal',
  '外部': 'external',
}

const methodMapping: Record<string, string> = {
  '线上': 'online',
  '线下': 'offline',
  '混合': 'hybrid',
}

const examMethodMapping: Record<string, string> = {
  '笔试': 'written',
  '实操': 'practical',
  '口试': 'oral',
  '无': 'none',
}

// POST /api/training/import - 批量导入培训记录
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

    const results = {
      success: 0,
      error: 0,
      errors: [] as string[],
    }

    // 获取当前公司已有的培训记录数量，用于生成编号
    const existingCount = await prisma.training.count({
      where: { company_id: user.company_id },
    })

    // 逐条处理导入数据
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 1

      try {
        // 提取字段
        const trainingDate = row['培训日期']
        const topic = row['培训主题']
        const category = row['培训类别']
        const level = row['培训级别']
        const targetDept = row['培训对象']
        const planCount = row['计划人数']
        const actualCount = row['实际参加人数']
        const hours = row['培训时长(小时)']
        const instructor = row['培训讲师']
        const instructorSource = row['讲师来源']
        const method = row['培训方式']
        const examMethod = row['考核方式']
        const passRate = row['考核通过率(%)']
        const effectScore = row['培训效果评分(1-5)']

        // 验证必填字段
        if (!trainingDate || !topic) {
          results.error++
          results.errors.push(`第${rowNum}行: 培训日期和培训主题为必填项`)
          continue
        }

        // 转换日期格式
        let parsedDate: Date
        try {
          parsedDate = new Date(trainingDate)
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date')
          }
        } catch {
          results.error++
          results.errors.push(`第${rowNum}行: 培训日期格式无效`)
          continue
        }

        // 转换枚举字段
        const categoryCode = category ? (categoryMapping[category] || null) : null
        const levelCode = level ? (levelMapping[level] || null) : null
        const instructorSourceCode = instructorSource ? (instructorSourceMapping[instructorSource] || null) : null
        const methodCode = method ? (methodMapping[method] || null) : null
        const examMethodCode = examMethod ? (examMethodMapping[examMethod] || null) : null

        // 验证选项值
        if (category && !categoryCode) {
          results.error++
          results.errors.push(`第${rowNum}行: 培训类别"${category}"无效，可选值: 安全培训、质量培训、技能培训、管理培训、合规培训`)
          continue
        }
        if (level && !levelCode) {
          results.error++
          results.errors.push(`第${rowNum}行: 培训级别"${level}"无效，可选值: 公司级、部门级、班组级`)
          continue
        }
        if (instructorSource && !instructorSourceCode) {
          results.error++
          results.errors.push(`第${rowNum}行: 讲师来源"${instructorSource}"无效，可选值: 内部、外部`)
          continue
        }
        if (method && !methodCode) {
          results.error++
          results.errors.push(`第${rowNum}行: 培训方式"${method}"无效，可选值: 线上、线下、混合`)
          continue
        }
        if (examMethod && !examMethodCode) {
          results.error++
          results.errors.push(`第${rowNum}行: 考核方式"${examMethod}"无效，可选值: 笔试、实操、口试、无`)
          continue
        }

        // 转换数字字段
        const planCountNum = planCount ? Number(planCount) : null
        const actualCountNum = actualCount ? Number(actualCount) : null
        const hoursNum = hours ? Number(hours) : null
        const passRateNum = passRate ? Number(passRate) : null
        const effectScoreNum = effectScore ? Number(effectScore) : null

        // 验证数字范围
        if (passRateNum !== null && (passRateNum < 0 || passRateNum > 100)) {
          results.error++
          results.errors.push(`第${rowNum}行: 考核通过率必须在0-100之间`)
          continue
        }
        if (effectScoreNum !== null && (effectScoreNum < 1 || effectScoreNum > 5)) {
          results.error++
          results.errors.push(`第${rowNum}行: 培训效果评分必须在1-5之间`)
          continue
        }

        // 生成培训编号
        const trainingNo = generateTrainingNo(existingCount + results.success + 1)

        // 创建培训记录
        await prisma.training.create({
          data: {
            company_id: user.company_id,
            training_no: trainingNo,
            training_date: parsedDate,
            topic: String(topic).trim(),
            category: categoryCode,
            level: levelCode,
            target_dept: targetDept ? String(targetDept).trim() : null,
            plan_count: planCountNum,
            actual_count: actualCountNum,
            hours: hoursNum,
            instructor: instructor ? String(instructor).trim() : null,
            instructor_source: instructorSourceCode,
            method: methodCode,
            exam_method: examMethodCode,
            pass_rate: passRateNum,
            effect_score: effectScoreNum,
            created_by: user.id,
          },
        })

        results.success++
      } catch (error) {
        results.error++
        results.errors.push(`第${rowNum}行: 导入失败 - ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }

    return NextResponse.json({
      code: 0,
      message: `导入完成: 成功${results.success}条，失败${results.error}条`,
      data: results,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Import training error:', error)
    return NextResponse.json(
      { code: 500, message: '服务器错误', data: null },
      { status: 500 }
    )
  }
}
