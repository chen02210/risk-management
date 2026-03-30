'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { riskLevelColors, riskCategoryLabel, formatDate } from '@/lib/utils'

interface DashboardStats {
  totalRisks: number
  risksByLevel: { level: string; count: number }[]
  risksByCategory: { category: string; count: number }[]
  pendingMeasures: number
  kriAlertCount: number
  recentRisks: any[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      const data = await res.json()
      if (data.code === 0) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">管理驾驶舱</h2>
        <p className="text-gray-500">风险概况实时监控</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>风险总数</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalRisks || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>高及以上风险</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {stats?.risksByLevel?.filter(r => ['高', '极高'].includes(r.level)).reduce((sum, r) => sum + r.count, 0) || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>待办措施</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats?.pendingMeasures || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>KRI预警</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats?.kriAlertCount || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 风险等级分布 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>风险等级分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.risksByLevel?.map((item) => {
                const colors = riskLevelColors[item.level] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
                return (
                  <div key={item.level} className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                      {item.level}风险
                    </span>
                    <span className="text-lg font-semibold">{item.count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>风险类别分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.risksByCategory?.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <span className="text-sm">{riskCategoryLabel[item.category] || item.category}</span>
                  <span className="text-lg font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最新风险 */}
      <Card>
        <CardHeader>
          <CardTitle>最新风险登记</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">编号</th>
                  <th className="text-left py-2">名称</th>
                  <th className="text-left py-2">等级</th>
                  <th className="text-left py-2">登记日期</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentRisks?.map((risk) => {
                  const colors = riskLevelColors[risk.risk_level] || { bg: 'bg-gray-50', text: 'text-gray-700' }
                  return (
                    <tr key={risk.id} className="border-b">
                      <td className="py-2">{risk.risk_no}</td>
                      <td className="py-2">{risk.name}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}>
                          {risk.risk_level}
                        </span>
                      </td>
                      <td className="py-2">{formatDate(risk.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
