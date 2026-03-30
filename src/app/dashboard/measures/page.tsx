'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExcelImportDialog } from '@/components/ExcelImportDialog'
import { measureStatusLabels, measureStatusColors, formatDate, formatAmount } from '@/lib/utils'
import { Plus, Search, Edit, Trash2, X, Upload } from 'lucide-react'

interface Measure {
  id: string
  measure_no: number
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
  start_date: string | null
  plan_date: string | null
  actual_date: string | null
  budget: string | null
  actual_cost: string | null
  effect_evaluation: string | null
  remaining_issue: string | null
  risk: {
    id: string
    risk_no: string
    name: string
  } | null
  department: {
    id: string
    name: string
  } | null
  owner: {
    id: string
    name: string
  } | null
  created_at: string
}

interface Risk {
  id: string
  risk_no: string
  name: string
}

interface User {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
}

const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'delayed', label: '已延期' },
  { value: 'cancelled', label: '已取消' },
]

export default function MeasuresPage() {
  const [measures, setMeasures] = useState<Measure[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // 对话框状态
  const [showDialog, setShowDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // 导入对话框状态
  const [showImportDialog, setShowImportDialog] = useState(false)
  
  // 模板表头
  const templateHeaders = ['关联风险编号', '措施描述', '责任部门', '责任人', '开始日期', '计划完成日期', '预算(万元)', '状态']
  
  // 表单数据
  const [risks, setRisks] = useState<Risk[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState({
    risk_id: '',
    description: '',
    dept_id: '',
    owner_id: '',
    start_date: '',
    plan_date: '',
    budget: '',
    status: 'pending',
  })

  const fetchMeasures = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('pageSize', '10')
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const res = await fetch(`/api/measures?${params.toString()}`)
      const data = await res.json()
      if (data.code === 0) {
        setMeasures(data.data.list)
        setTotalPages(data.data.totalPages)
        setTotal(data.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch measures:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOptions = async () => {
    try {
      const [risksRes, usersRes, deptsRes] = await Promise.all([
        fetch('/api/risks?pageSize=100'),
        fetch('/api/users?pageSize=100'),
        fetch('/api/departments'),
      ])
      
      const [risksData, usersData, deptsData] = await Promise.all([
        risksRes.json(),
        usersRes.json(),
        deptsRes.json(),
      ])
      
      if (risksData.code === 0) setRisks(risksData.data.list)
      if (usersData.code === 0) setUsers(usersData.data.list)
      if (deptsData.code === 0) setDepartments(deptsData.data)
    } catch (error) {
      console.error('Failed to fetch options:', error)
    }
  }

  useEffect(() => {
    fetchMeasures()
  }, [page, statusFilter])

  const handleSearch = () => {
    setPage(1)
    fetchMeasures()
  }

  const openCreateDialog = () => {
    setDialogMode('create')
    setEditingId(null)
    setFormData({
      risk_id: '',
      description: '',
      dept_id: '',
      owner_id: '',
      start_date: '',
      plan_date: '',
      budget: '',
      status: 'pending',
    })
    fetchOptions()
    setShowDialog(true)
  }

  const openEditDialog = (measure: Measure) => {
    setDialogMode('edit')
    setEditingId(measure.id)
    setFormData({
      risk_id: measure.risk?.id || '',
      description: measure.description,
      dept_id: measure.department?.id || '',
      owner_id: measure.owner?.id || '',
      start_date: measure.start_date || '',
      plan_date: measure.plan_date || '',
      budget: measure.budget || '',
      status: measure.status,
    })
    fetchOptions()
    setShowDialog(true)
  }

  const handleSubmit = async () => {
    try {
      const url = dialogMode === 'create' 
        ? '/api/measures' 
        : `/api/measures/${editingId}`
      
      const res = await fetch(url, {
        method: dialogMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.code === 0) {
        setShowDialog(false)
        fetchMeasures()
      } else {
        alert(data.message || '操作失败')
      }
    } catch (error) {
      alert('网络错误')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个措施吗？')) return
    
    try {
      const res = await fetch(`/api/measures/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.code === 0) {
        fetchMeasures()
      } else {
        alert(data.message || '删除失败')
      }
    } catch (error) {
      alert('删除失败')
    }
  }

  // 计算统计数据
  const stats = {
    inProgress: measures.filter(m => m.status === 'in_progress').length,
    completed: measures.filter(m => m.status === 'completed').length,
    pending: measures.filter(m => m.status === 'pending').length,
    delayed: measures.filter(m => m.status === 'delayed').length,
  }

  const totalBudget = measures.reduce((sum, m) => sum + (parseFloat(m.budget || '0') || 0), 0)
  const totalCost = measures.reduce((sum, m) => sum + (parseFloat(m.actual_cost || '0') || 0), 0)

  if (loading && measures.length === 0) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">风险应对措施</h2>
          <p className="text-gray-500">风险应对措施的跟踪和管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            导入
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            新增措施
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-sm text-gray-500">进行中</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-sm text-gray-500">已完成</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-sm text-gray-500">待开始</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.delayed}</div>
            <p className="text-sm text-gray-500">已延期</p>
          </CardContent>
        </Card>
      </div>

      {/* 预算统计 */}
      <Card>
        <CardHeader>
          <CardTitle>预算执行情况</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">总预算</div>
              <div className="text-xl font-semibold">{formatAmount(totalBudget)}万元</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">实际投入</div>
              <div className="text-xl font-semibold">{formatAmount(totalCost)}万元</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">预算偏差</div>
              <div className={`text-xl font-semibold ${totalCost > totalBudget ? 'text-red-600' : 'text-green-600'}`}>
                {formatAmount(totalCost - totalBudget)}万元
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="搜索措施描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-64"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <select
              className="px-3 py-2 border rounded-md bg-white"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              {statusFilters.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 措施列表 */}
      <Card>
        <CardHeader>
          <CardTitle>措施列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>序号</TableHead>
                <TableHead>关联风险</TableHead>
                <TableHead>措施描述</TableHead>
                <TableHead>责任部门</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>计划完成</TableHead>
                <TableHead>预算(万元)</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {measures.map((measure) => (
                <TableRow key={measure.id}>
                  <TableCell>{measure.measure_no}</TableCell>
                  <TableCell>
                    {measure.risk ? (
                      <div>
                        <div className="font-medium">{measure.risk.risk_no}</div>
                        <div className="text-xs text-gray-500">{measure.risk.name}</div>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{measure.description}</TableCell>
                  <TableCell>{measure.department?.name || '-'}</TableCell>
                  <TableCell>{measure.owner?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge className={measureStatusColors[measure.status]}>
                      {measureStatusLabels[measure.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(measure.plan_date)}</TableCell>
                  <TableCell>{formatAmount(parseFloat(measure.budget || '0'))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditDialog(measure)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(measure.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 分页 */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              共 {total} 条，第 {page} 页，共 {totalPages} 页
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 创建/编辑对话框 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {dialogMode === 'create' ? '新增措施' : '编辑措施'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDialog(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>关联风险 *</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.risk_id}
                  onChange={(e) => setFormData({...formData, risk_id: e.target.value})}
                >
                  <option value="">请选择风险</option>
                  {risks.map(risk => (
                    <option key={risk.id} value={risk.id}>
                      {risk.risk_no} - {risk.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>措施描述 *</Label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="详细描述应对措施..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>责任部门</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.dept_id}
                    onChange={(e) => setFormData({...formData, dept_id: e.target.value})}
                  >
                    <option value="">请选择部门</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>责任人</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.owner_id}
                    onChange={(e) => setFormData({...formData, owner_id: e.target.value})}
                  >
                    <option value="">请选择责任人</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>开始日期</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>计划完成日期</Label>
                  <Input
                    type="date"
                    value={formData.plan_date}
                    onChange={(e) => setFormData({...formData, plan_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>预算(万元)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>状态</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    {statusFilters.filter(s => s.value !== 'all').map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit}>
                {dialogMode === 'create' ? '创建' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Excel导入对话框 */}
      <ExcelImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        title="风险应对措施"
        templateHeaders={templateHeaders}
        templateFileName="措施导入模板"
        onImport={async (data) => {
          const res = await fetch('/api/measures/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data }),
          })
          const result = await res.json()
          if (result.code === 0) {
            return result.data
          }
          throw new Error(result.message)
        }}
        onSuccess={() => {
          fetchMeasures()
          setShowImportDialog(false)
        }}
      />
    </div>
  )
}
