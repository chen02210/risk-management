import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 风险等级计算
export function calculateRiskLevel(riskValue: number): string {
  if (riskValue <= 4) return '低'
  if (riskValue <= 9) return '中'
  if (riskValue <= 16) return '高'
  return '极高'
}

// 风险编号前缀映射
export const riskCategoryPrefix: Record<string, string> = {
  safety: 'S',
  production: 'P',
  quality: 'Q',
  supply_chain: 'C',
  financial: 'F',
  compliance: 'R',
  information: 'I',
}

export const riskCategoryLabel: Record<string, string> = {
  safety: '安全环保',
  production: '生产运营',
  quality: '质量',
  supply_chain: '供应链',
  financial: '财务',
  compliance: '合规',
  information: '信息安全',
}

// 生成风险编号
export function generateRiskNo(category: string, sequence: number): string {
  const prefix = riskCategoryPrefix[category] || 'R'
  return `${prefix}-${String(sequence).padStart(3, '0')}`
}

// 格式化日期
export function formatDate(date: Date | string | null): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 格式化金额
export function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// 风险等级颜色映射
export const riskLevelColors: Record<string, { bg: string; text: string; border: string }> = {
  '低': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  '中': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  '高': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  '极高': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
}

// KRI状态颜色映射
export const kriStatusColors: Record<string, { bg: string; text: string }> = {
  'normal': { bg: 'bg-green-100', text: 'text-green-800' },
  'warning': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'alert': { bg: 'bg-red-100', text: 'text-red-800' },
}

// 用户角色标签
export const userRoleLabels: Record<string, string> = {
  super_admin: '超级管理员',
  company_admin: '公司管理员',
  dept_admin: '部门管理员',
  user: '普通用户',
  readonly: '只读用户',
}

// 措施状态标签
export const measureStatusLabels: Record<string, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  delayed: '已延期',
  cancelled: '已取消',
}

// 措施状态颜色
export const measureStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  delayed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

// ==================== 供应商管理工具函数 ====================

// 供应商风险等级计算
export function calculateSupplierRiskLevel(totalScore: number | null): string {
  if (!totalScore) return '未评估'
  if (totalScore >= 85) return '低'
  if (totalScore >= 70) return '中'
  if (totalScore >= 50) return '高'
  return '极高'
}

// 供应商综合得分计算
interface SupplierScoreParams {
  on_time_rate?: number | null
  quality_rate?: number | null
  price_competitiveness?: number | null
  financial_stability?: number | null
  service_cooperation?: number | null
}

export function calculateSupplierScore(params: SupplierScoreParams): number | null {
  const {
    on_time_rate,
    quality_rate,
    price_competitiveness,
    financial_stability,
    service_cooperation,
  } = params

  // 如果关键指标缺失，返回null
  if (!on_time_rate || !quality_rate) return null

  // 权重：交期达成率30%，质量合格率30%，价格竞争力20%，财务稳定性10%，服务配合度10%
  const score = 
    (on_time_rate * 0.3) + 
    (quality_rate * 0.3) + 
    ((price_competitiveness || 0) * 2) + 
    ((financial_stability || 0) * 2) + 
    ((service_cooperation || 0) * 2)
  
  return Math.round(score * 100) / 100
}

// 生成供应商编号
export function generateSupplierNo(sequence: number): string {
  return `SUP-${String(sequence).padStart(4, '0')}`
}

// 供应商状态标签
export const supplierStatusLabels: Record<string, string> = {
  active: '合作中',
  inactive: '已停用',
  blacklisted: '黑名单',
}

// 供应商状态颜色
export const supplierStatusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  blacklisted: 'bg-red-100 text-red-800',
}

// 供应商风险等级颜色
export const supplierRiskLevelColors: Record<string, { bg: string; text: string; border: string }> = {
  '低': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  '中': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  '高': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  '极高': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  '未评估': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
}

// ==================== 培训管理工具函数 ====================

// 生成培训编号
export function generateTrainingNo(sequence: number): string {
  const year = new Date().getFullYear()
  return `TR-${year}-${String(sequence).padStart(4, '0')}`
}

// 培训类别标签
export const trainingCategoryLabels: Record<string, string> = {
  safety: '安全培训',
  quality: '质量培训',
  skill: '技能培训',
  management: '管理培训',
  compliance: '合规培训',
  emergency: '应急培训',
  other: '其他培训',
}

// 培训类别颜色
export const trainingCategoryColors: Record<string, string> = {
  safety: 'bg-red-100 text-red-800',
  quality: 'bg-blue-100 text-blue-800',
  skill: 'bg-green-100 text-green-800',
  management: 'bg-purple-100 text-purple-800',
  compliance: 'bg-yellow-100 text-yellow-800',
  emergency: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
}

// 培训级别标签
export const trainingLevelLabels: Record<string, string> = {
  company: '公司级',
  dept: '部门级',
  team: '班组级',
  external: '外部培训',
}

// 培训方式标签
export const trainingMethodLabels: Record<string, string> = {
  online: '线上培训',
  offline: '线下培训',
  hybrid: '混合培训',
}

// 讲师来源标签
export const instructorSourceLabels: Record<string, string> = {
  internal: '内部讲师',
  external: '外部讲师',
}

// 考核方式标签
export const examMethodLabels: Record<string, string> = {
  written: '笔试',
  practical: '实操考核',
  oral: '口试',
  none: '不考核',
}

// 培训效果评分颜色（1-5分）
export function getEffectScoreColor(score: number | null): string {
  if (!score) return 'bg-gray-100 text-gray-800'
  if (score >= 4.5) return 'bg-green-100 text-green-800'
  if (score >= 3.5) return 'bg-blue-100 text-blue-800'
  if (score >= 2.5) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

// 通过率颜色
export function getPassRateColor(rate: number | null): string {
  if (!rate) return 'bg-gray-100 text-gray-800'
  if (rate >= 90) return 'bg-green-100 text-green-800'
  if (rate >= 80) return 'bg-blue-100 text-blue-800'
  if (rate >= 60) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}
