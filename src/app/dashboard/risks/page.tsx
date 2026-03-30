'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { riskLevelColors, riskCategoryLabel, formatDate } from '@/lib/utils'
import { Search, Plus, Edit, Trash2, Eye, Upload } from 'lucide-react'
import { ExcelImportDialog } from '@/components/ExcelImportDialog'

interface Risk {
  id: string
  risk_no: string
  name: string
  category: string
  risk_level: string
  risk_value: number
  status: string
  owner: { name: string } | null
  department: { name: string } | null
  next_evaluate_at: string | null
  _count: { measures: number }
}

const categories = [
  { value: '', label: '全部类别' },
  { value: 'safety', label: '安全环保' },
  { value: 'production', label: '生产运营' },
  { value: 'quality', label: '质量' },
  { value: 'supply_chain', label: '供应链' },
  { value: 'financial', label: '财务' },
  { value: 'compliance', label: '合规' },
  { value: 'information', label: '信息安全' },
]

const riskLevels = [
  { value: '', label: '全部等级' },
  { value: '低', label: '低' },
  { value: '中', label: '中' },
  { value: '高', label: '高' },
  { value: '极高', label: '极高' },
]

export default function RisksPage() {
  const router = useRouter()
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    fetchRisks()
  }, [page, categoryFilter, levelFilter])

  const fetchRisks = async () => {
    try {
      let url = `/api/risks?page=${page}&pageSize=10`
      if (categoryFilter) url += `&category=${categoryFilter}`
      if (levelFilter) url += `&risk_level=${levelFilter}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      
      const res = await fetch(url)
      const data = await res.json()
      if (data.code === 0) {
        setRisks(data.data.list)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch risks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchRisks()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个风险吗？')) return
    
    try {
      const res = await fetch(`/api/risks/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.code === 0) {
        fetchRisks()
      } else {
        alert(data.message || '删除失败')
      }
    } catch (error) {
      alert('删除失败')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      transferred: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
    }
    const labels: Record<string, string> = {
      active: '活动中',
      closed: '已关闭',
      transferred: '已转移',
      pending: '待评估',
    }
    return <Badge className={styles[status] || ''}>{labels[status] || status}</Badge>
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">风险登记台账</h2>
          <p className="text-gray-500">风险识别、评估和跟踪管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            导入Excel
          </Button>
          <Button onClick={() => router.push('/dashboard/risks/new')}>
            <Plus className="w-4 h-4 mr-2" />
            新增风险
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="flex gap-2">
                <Input
                  placeholder="搜索风险名称或编号..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="outline" onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <select
              className="px-3 py-2 border rounded-md bg-white"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            >
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border rounded-md bg-white"
              value={levelFilter}
              onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
            >
              {riskLevels.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>风险列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>编号</TableHead>
                <TableHead>风险名称</TableHead>
                <TableHead>类别</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>分值</TableHead>
                <TableHead>责任人</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>措施</TableHead>
                <TableHead>评估日期</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risks.map((risk) => {
                const colors = riskLevelColors[risk.risk_level] || { bg: 'bg-gray-50', text: 'text-gray-700' }
                return (
                  <TableRow key={risk.id}>
                    <TableCell className="font-medium">{risk.risk_no}</TableCell>
                    <TableCell>{risk.name}</TableCell>
                    <TableCell>{riskCategoryLabel[risk.category] || risk.category}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {risk.risk_level}
                      </span>
                    </TableCell>
                    <TableCell>{risk.risk_value}</TableCell>
                    <TableCell>{risk.owner?.name || '-'}</TableCell>
                    <TableCell>{risk.department?.name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(risk.status)}</TableCell>
                    <TableCell>{risk._count.measures}</TableCell>
                    <TableCell>{formatDate(risk.next_evaluate_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" title="查看">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="编辑">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="删除"
                          onClick={() => handleDelete(risk.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* 分页 */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              第 {page} 页，共 {totalPages} 页
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 导入对话框 */}
      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="风险登记"
        templateHeaders={['风险名称', '风险类别', '风险描述', '潜在后果', '风险来源', '可能性(1-5)', '影响度(1-5)', '应对策略', '责任部门', '责任人', '下次评估日期']}
        templateFileName="风险台账"
        onImport={async (data) => {
          const res = await fetch('/api/risks/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data })
          })
          const result = await res.json()
          if (result.code === 0) {
            fetchRisks()
            return result.data
          }
          throw new Error(result.message)
        }}
        onSuccess={() => setImportOpen(false)}
      />
    </div>
  )
}
