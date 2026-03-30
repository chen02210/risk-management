'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { riskCategoryLabel, riskLevelColors } from '@/lib/utils'

interface Risk {
  id: string
  risk_no: string
  name: string
  category: string
  likelihood: number
  impact: number
  risk_value: number
  risk_level: string
  status: string
  owner: { name: string } | null
}

export default function RiskMatrixPage() {
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState<{l: number, i: number} | null>(null)

  useEffect(() => {
    fetchRisks()
  }, [])

  const fetchRisks = async () => {
    try {
      const res = await fetch('/api/risks?pageSize=1000')
      const data = await res.json()
      if (data.code === 0) {
        setRisks(data.data.list.filter((r: Risk) => r.status === 'active'))
      }
    } catch (error) {
      console.error('Failed to fetch risks:', error)
    } finally {
      setLoading(false)
    }
  }

  // 构建矩阵数据
  const matrix = Array(5).fill(null).map(() => Array(5).fill([]))
  risks.forEach(risk => {
    const l = risk.likelihood - 1
    const i = risk.impact - 1
    if (l >= 0 && l < 5 && i >= 0 && i < 5) {
      matrix[l][i] = [...matrix[l][i], risk]
    }
  })

  // 矩阵单元格颜色
  const getCellColor = (l: number, i: number) => {
    const value = (l + 1) * (i + 1)
    if (value <= 4) return 'bg-green-100 hover:bg-green-200'
    if (value <= 9) return 'bg-yellow-100 hover:bg-yellow-200'
    if (value <= 16) return 'bg-orange-100 hover:bg-orange-200'
    return 'bg-red-100 hover:bg-red-200'
  }

  const likelihoodLabels = ['极低(1)', '低(2)', '中(3)', '高(4)', '极高(5)']
  const impactLabels = ['极低(1)', '低(2)', '中(3)', '高(4)', '极高(5)']

  const filteredRisks = selectedCell 
    ? matrix[selectedCell.l][selectedCell.i] 
    : []

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">风险矩阵</h2>
        <p className="text-gray-500">可视化风险评估矩阵图</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 矩阵图 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>风险评估矩阵</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex">
              {/* Y轴标签 */}
              <div className="flex flex-col justify-center pr-4">
                <span className="text-sm font-medium text-gray-500 transform -rotate-90 whitespace-nowrap">
                  可能性 →
                </span>
              </div>
              <div className="flex-1">
                {/* 矩阵 */}
                <div className="grid grid-cols-6 gap-1">
                  {/* 表头 */}
                  <div className="p-2"></div>
                  {impactLabels.map((label, i) => (
                    <div key={i} className="p-2 text-center text-xs font-medium text-gray-500">
                      {label}
                    </div>
                  ))}
                  
                  {/* 矩阵行 */}
                  {[4, 3, 2, 1, 0].map(l => (
                    <>
                      <div key={`label-${l}`} className="p-2 text-right text-xs font-medium text-gray-500 flex items-center justify-end">
                        {likelihoodLabels[l]}
                      </div>
                      {[0, 1, 2, 3, 4].map(i => {
                        const cellRisks = matrix[l][i]
                        const isSelected = selectedCell?.l === l && selectedCell?.i === i
                        return (
                          <div
                            key={`${l}-${i}`}
                            className={`
                              p-2 min-h-[80px] rounded cursor-pointer transition-all
                              ${getCellColor(l, i)}
                              ${isSelected ? 'ring-2 ring-blue-500' : ''}
                            `}
                            onClick={() => setSelectedCell({l, i})}
                          >
                            <div className="flex flex-wrap gap-1">
                              {cellRisks.map((risk: Risk) => (
                                <div
                                  key={risk.id}
                                  className="w-2 h-2 rounded-full bg-gray-700"
                                  title={risk.name}
                                />
                              ))}
                            </div>
                            <div className="text-xs text-center mt-1 font-medium">
                              {(l + 1) * (i + 1)}
                            </div>
                            {cellRisks.length > 0 && (
                              <div className="text-xs text-center text-gray-600">
                                {cellRisks.length}个
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </>
                  ))}
                </div>
                <div className="text-center mt-2 text-sm text-gray-500">
                  影响程度 →
                </div>
              </div>
            </div>
            
            {/* 图例 */}
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-100 border"></div>
                <span className="text-xs">低(1-4)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-yellow-100 border"></div>
                <span className="text-xs">中(5-9)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-orange-100 border"></div>
                <span className="text-xs">高(10-16)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-100 border"></div>
                <span className="text-xs">极高(17-25)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 风险列表 */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCell ? `矩阵单元格风险 (${filteredRisks.length})` : '点击矩阵查看风险'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCell ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredRisks.map((risk: Risk) => {
                  const colors = riskLevelColors[risk.risk_level] || { bg: 'bg-gray-50', text: 'text-gray-700' }
                  return (
                    <div key={risk.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">{risk.risk_no}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}>
                          {risk.risk_level}
                        </span>
                      </div>
                      <div className="text-sm font-medium">{risk.name}</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{riskCategoryLabel[risk.category]}</span>
                        <span>•</span>
                        <span>责任人: {risk.owner?.name || '-'}</span>
                      </div>
                    </div>
                  )
                })}
                {filteredRisks.length === 0 && (
                  <div className="text-center text-gray-500 py-8">该单元格暂无风险</div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                点击左侧矩阵单元格<br />查看对应风险
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
