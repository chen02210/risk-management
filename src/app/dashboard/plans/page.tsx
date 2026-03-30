'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { ExcelImportDialog } from '@/components/ExcelImportDialog'
import { AlertCircle, Calendar, CheckCircle, Clock, Plus, RefreshCw, Search, Shield, Trash2, Edit, History, AlertTriangle, Upload } from 'lucide-react'

interface EmergencyPlan {
  id: string
  plan_no: string
  name: string
  linked_risk_no: string | null
  applicable_scenario: string | null
  trigger_condition: string | null
  commander: string | null
  site_commander: string | null
  response_time_limit: string | null
  key_steps: string | null
  resource_needs: string | null
  drill_frequency: string | null
  last_drill: string | null
  next_drill: string | null
  drill_result: string | null
  improvement: string | null
  version: string
  latest_revision: string | null
  status: string
  dept_id: string | null
  department: { name: string } | null
  created_at: string
  updated_at: string
  drill_status?: string
}

const drillFrequencyLabels: Record<string, string> = {
  monthly: '每月',
  quarterly: '每季度',
  half_yearly: '每半年',
  yearly: '每年',
}

const drillStatusConfig: Record<string, { label: string; color: string }> = {
  normal: { label: '正常', color: 'bg-green-100 text-green-800' },
  warning: { label: '即将到期', color: 'bg-yellow-100 text-yellow-800' },
  overdue: { label: '已逾期', color: 'bg-red-100 text-red-800' },
}

export default function EmergencyPlansPage() {
  const [plans, setPlans] = useState<EmergencyPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDrillModal, setShowDrillModal] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<EmergencyPlan | null>(null)

  // Excel导入模板表头
  const templateHeaders = ['预案名称', '关联风险编号', '适用场景', '触发条件', '应急总指挥', '现场指挥', '响应时限', '演练频率', '责任部门']

  // 演练频率映射（中文转英文）
  const drillFrequencyMap: Record<string, string> = {
    '每月': 'monthly',
    '每季度': 'quarterly',
    '每半年': 'half_yearly',
    '每年': 'yearly',
  }

  // 处理导入数据
  const handleImport = async (data: any[]) => {
    const results = {
      success: 0,
      error: 0,
      errors: [] as string[],
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      try {
        // 验证必填字段
        if (!row['预案名称']) {
          results.error++
          results.errors.push(`第${i + 2}行: 预案名称为必填项`)
          continue
        }

        // 转换演练频率
        const drillFrequency = row['演练频率'] ? drillFrequencyMap[row['演练频率']] : null

        const importData = {
          name: row['预案名称'],
          linked_risk_no: row['关联风险编号'] || null,
          applicable_scenario: row['适用场景'] || null,
          trigger_condition: row['触发条件'] || null,
          commander: row['应急总指挥'] || null,
          site_commander: row['现场指挥'] || null,
          response_time_limit: row['响应时限'] || null,
          drill_frequency: drillFrequency,
          dept_name: row['责任部门'] || null,
        }

        const res = await fetch('/api/plans/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importData),
        })

        const result = await res.json()
        if (result.code === 0) {
          results.success++
        } else {
          results.error++
          results.errors.push(`第${i + 2}行: ${result.message || '导入失败'}`)
        }
      } catch (error) {
        results.error++
        results.errors.push(`第${i + 2}行: ${(error as Error).message}`)
      }
    }

    return results
  }
  const [formData, setFormData] = useState<Partial<EmergencyPlan>>({
    name: '',
    linked_risk_no: '',
    applicable_scenario: '',
    trigger_condition: '',
    commander: '',
    site_commander: '',
    response_time_limit: '',
    key_steps: '',
    resource_needs: '',
    drill_frequency: '',
    status: 'active',
  })
  const [drillData, setDrillData] = useState({
    last_drill: '',
    next_drill: '',
    drill_result: '',
    improvement: '',
  })
  const [versionData, setVersionData] = useState({
    version: '',
    key_steps: '',
    resource_needs: '',
  })

  useEffect(() => {
    fetchPlans()
  }, [page, statusFilter, showOverdueOnly])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      let url = `/api/plans?page=${page}&pageSize=10`
      if (statusFilter) url += `&status=${statusFilter}`
      if (showOverdueOnly) url += `&drill_overdue=true`
      if (search) url += `&search=${encodeURIComponent(search)}`
      
      const res = await fetch(url)
      const data = await res.json()
      if (data.code === 0) {
        setPlans(data.data.list)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchPlans()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      linked_risk_no: '',
      applicable_scenario: '',
      trigger_condition: '',
      commander: '',
      site_commander: '',
      response_time_limit: '',
      key_steps: '',
      resource_needs: '',
      drill_frequency: '',
      status: 'active',
    })
  }

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.code === 0) {
        setShowCreateModal(false)
        resetForm()
        fetchPlans()
      }
    } catch (error) {
      console.error('Failed to create plan:', error)
    }
  }

  const handleUpdate = async () => {
    if (!selectedPlan) return
    try {
      const res = await fetch(`/api/plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.code === 0) {
        setShowEditModal(false)
        setSelectedPlan(null)
        resetForm()
        fetchPlans()
      }
    } catch (error) {
      console.error('Failed to update plan:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该预案吗？')) return
    try {
      const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.code === 0) {
        fetchPlans()
      }
    } catch (error) {
      console.error('Failed to delete plan:', error)
    }
  }

  const handleUpdateDrill = async () => {
    if (!selectedPlan) return
    try {
      const res = await fetch(`/api/plans/${selectedPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(drillData),
      })
      const data = await res.json()
      if (data.code === 0) {
        setShowDrillModal(false)
        setSelectedPlan(null)
        setDrillData({ last_drill: '', next_drill: '', drill_result: '', improvement: '' })
        fetchPlans()
      }
    } catch (error) {
      console.error('Failed to update drill:', error)
    }
  }

  const handleVersionUpgrade = async () => {
    if (!selectedPlan) return
    try {
      const res = await fetch(`/api/plans/${selectedPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: versionData.version,
          key_steps: versionData.key_steps,
          resource_needs: versionData.resource_needs,
        }),
      })
      const data = await res.json()
      if (data.code === 0) {
        setShowVersionModal(false)
        setSelectedPlan(null)
        setVersionData({ version: '', key_steps: '', resource_needs: '' })
        fetchPlans()
      }
    } catch (error) {
      console.error('Failed to upgrade version:', error)
    }
  }

  const openEditModal = (plan: EmergencyPlan) => {
    setSelectedPlan(plan)
    setFormData({
      name: plan.name,
      linked_risk_no: plan.linked_risk_no || '',
      applicable_scenario: plan.applicable_scenario || '',
      trigger_condition: plan.trigger_condition || '',
      commander: plan.commander || '',
      site_commander: plan.site_commander || '',
      response_time_limit: plan.response_time_limit || '',
      key_steps: plan.key_steps || '',
      resource_needs: plan.resource_needs || '',
      drill_frequency: plan.drill_frequency || '',
      status: plan.status,
    })
    setShowEditModal(true)
  }

  const openDrillModal = (plan: EmergencyPlan) => {
    setSelectedPlan(plan)
    setDrillData({
      last_drill: plan.last_drill ? plan.last_drill.split('T')[0] : '',
      next_drill: plan.next_drill ? plan.next_drill.split('T')[0] : '',
      drill_result: plan.drill_result || '',
      improvement: plan.improvement || '',
    })
    setShowDrillModal(true)
  }

  const openVersionModal = (plan: EmergencyPlan) => {
    setSelectedPlan(plan)
    const currentVersion = plan.version || '1.0'
    const versionParts = currentVersion.split('.')
    const newVersion = `${versionParts[0]}.${parseInt(versionParts[1] || '0') + 1}`
    setVersionData({
      version: newVersion,
      key_steps: plan.key_steps || '',
      resource_needs: plan.resource_needs || '',
    })
    setShowVersionModal(true)
  }

  const getDaysUntilDrill = (nextDrill: string | null) => {
    if (!nextDrill) return null
    const days = Math.ceil((new Date(nextDrill).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  // 统计信息
  const totalPlans = plans.length
  const overdueCount = plans.filter((p: EmergencyPlan) => p.drill_status === 'overdue').length
  const warningCount = plans.filter((p: EmergencyPlan) => p.drill_status === 'warning').length
  const activeCount = plans.filter((p: EmergencyPlan) => p.status === 'active').length

  // 简单的Modal组件
  const Modal = ({ isOpen, onClose, title, children, footer }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode }) => {
    if (!isOpen) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <div className="p-6">{children}</div>
          <div className="p-6 border-t flex justify-end gap-2">{footer}</div>
        </div>
      </div>
    )
  }

  if (loading && plans.length === 0) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">应急预案管理</h2>
          <p className="text-gray-500">应急预案的创建、演练跟踪和版本管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />导入
          </Button>
          <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />新增预案
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">预案总数</p>
                <p className="text-2xl font-bold">{totalPlans}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">活动中</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">即将演练</p>
                <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">演练逾期</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block">搜索</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="搜索预案名称、编号..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="outline" onClick={handleSearch}><Search className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="w-40">
              <Label className="mb-2 block">状态</Label>
              <select
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部</option>
                <option value="active">活动中</option>
                <option value="inactive">已停用</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="overdueOnly"
                checked={showOverdueOnly}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setShowOverdueOnly(e.target.checked); setPage(1); }}
                className="rounded border-gray-300"
              />
              <Label htmlFor="overdueOnly" className="cursor-pointer">仅显示逾期</Label>
            </div>
            <Button variant="outline" onClick={fetchPlans} className="mb-0"><RefreshCw className="w-4 h-4 mr-2" />刷新</Button>
          </div>
        </CardContent>
      </Card>

      {/* 预案列表 */}
      <Card>
        <CardHeader>
          <CardTitle>应急预案列表</CardTitle>
          <CardDescription>共 {plans.length} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>预案编号</TableHead>
                <TableHead>预案名称</TableHead>
                <TableHead>关联风险</TableHead>
                <TableHead>总指挥</TableHead>
                <TableHead>演练频次</TableHead>
                <TableHead>下次演练</TableHead>
                <TableHead>演练状态</TableHead>
                <TableHead>版本</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan: EmergencyPlan) => {
                const daysUntil = getDaysUntilDrill(plan.next_drill)
                const drillStatus = plan.drill_status || 'normal'
                const statusConfig = drillStatusConfig[drillStatus]
                return (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.plan_no}</TableCell>
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>{plan.linked_risk_no || '-'}</TableCell>
                    <TableCell>{plan.commander || '-'}</TableCell>
                    <TableCell>{plan.drill_frequency ? drillFrequencyLabels[plan.drill_frequency] : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(plan.next_drill)}
                        {daysUntil !== null && (
                          <span className={`text-xs ${daysUntil < 0 ? 'text-red-500' : daysUntil <= 7 ? 'text-yellow-600' : 'text-gray-400'}`}>
                            ({daysUntil < 0 ? `逾期${Math.abs(daysUntil)}天` : `还剩${daysUntil}天`})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">v{plan.version}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDrillModal(plan)} title="更新演练记录">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openVersionModal(plan)} title="版本升级">
                          <History className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(plan)} title="编辑">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id)} title="删除">
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
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                上一页
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 创建预案Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新增应急预案"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>取消</Button>
            <Button onClick={handleCreate}>创建</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>预案名称 *</Label>
            <Input value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })} placeholder="请输入预案名称" />
          </div>
          <div className="space-y-2">
            <Label>关联风险编号</Label>
            <Input value={formData.linked_risk_no || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, linked_risk_no: e.target.value })} placeholder="如: S-001" />
          </div>
          <div className="space-y-2">
            <Label>总指挥</Label>
            <Input value={formData.commander || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, commander: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>现场指挥</Label>
            <Input value={formData.site_commander || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, site_commander: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>响应时限</Label>
            <Input value={formData.response_time_limit || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, response_time_limit: e.target.value })} placeholder="如: 30分钟" />
          </div>
          <div className="space-y-2">
            <Label>演练频次</Label>
            <select
              value={formData.drill_frequency || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, drill_frequency: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择</option>
              <option value="monthly">每月</option>
              <option value="quarterly">每季度</option>
              <option value="half_yearly">每半年</option>
              <option value="yearly">每年</option>
            </select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label>适用场景</Label>
            <textarea
              value={formData.applicable_scenario || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, applicable_scenario: e.target.value })}
              placeholder="描述预案适用的场景"
              className="w-full h-20 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>触发条件</Label>
            <textarea
              value={formData.trigger_condition || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, trigger_condition: e.target.value })}
              placeholder="描述启动预案的条件"
              className="w-full h-20 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>关键步骤</Label>
            <textarea
              value={formData.key_steps || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, key_steps: e.target.value })}
              placeholder="描述应急响应的关键步骤"
              className="w-full h-24 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>资源需求</Label>
            <textarea
              value={formData.resource_needs || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, resource_needs: e.target.value })}
              placeholder="描述所需的人力、物资等资源"
              className="w-full h-20 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* 编辑预案Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑应急预案"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>取消</Button>
            <Button onClick={handleUpdate}>保存</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>预案名称</Label>
            <Input value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>关联风险编号</Label>
            <Input value={formData.linked_risk_no || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, linked_risk_no: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>总指挥</Label>
            <Input value={formData.commander || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, commander: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>现场指挥</Label>
            <Input value={formData.site_commander || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, site_commander: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>响应时限</Label>
            <Input value={formData.response_time_limit || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, response_time_limit: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>状态</Label>
            <select
              value={formData.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">活动中</option>
              <option value="inactive">已停用</option>
            </select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label>适用场景</Label>
            <textarea
              value={formData.applicable_scenario || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, applicable_scenario: e.target.value })}
              className="w-full h-20 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>触发条件</Label>
            <textarea
              value={formData.trigger_condition || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, trigger_condition: e.target.value })}
              className="w-full h-20 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>关键步骤</Label>
            <textarea
              value={formData.key_steps || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, key_steps: e.target.value })}
              className="w-full h-24 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>资源需求</Label>
            <textarea
              value={formData.resource_needs || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, resource_needs: e.target.value })}
              className="w-full h-20 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* 更新演练记录Modal */}
      <Modal
        isOpen={showDrillModal}
        onClose={() => setShowDrillModal(false)}
        title="更新演练记录"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDrillModal(false)}>取消</Button>
            <Button onClick={handleUpdateDrill}>保存</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>上次演练日期</Label>
            <Input type="date" value={drillData.last_drill} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDrillData({ ...drillData, last_drill: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>下次演练日期</Label>
            <Input type="date" value={drillData.next_drill} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDrillData({ ...drillData, next_drill: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>演练结果</Label>
            <textarea
              value={drillData.drill_result || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDrillData({ ...drillData, drill_result: e.target.value })}
              placeholder="描述演练的整体情况和效果评估"
              className="w-full h-24 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label>改进措施</Label>
            <textarea
              value={drillData.improvement || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDrillData({ ...drillData, improvement: e.target.value })}
              placeholder="记录演练中发现的问题及改进措施"
              className="w-full h-24 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* 版本升级Modal */}
      <Modal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        title="版本升级"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowVersionModal(false)}>取消</Button>
            <Button onClick={handleVersionUpgrade}>确认升级</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>新版本号</Label>
            <Input value={versionData.version} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVersionData({ ...versionData, version: e.target.value })} placeholder="如: 2.0" />
            <p className="text-xs text-gray-500">当前版本: v{selectedPlan?.version}</p>
          </div>
          <div className="space-y-2">
            <Label>更新后的关键步骤</Label>
            <textarea
              value={versionData.key_steps || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVersionData({ ...versionData, key_steps: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label>更新后的资源需求</Label>
            <textarea
              value={versionData.resource_needs || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVersionData({ ...versionData, resource_needs: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Excel导入对话框 */}
      <ExcelImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        title="应急预案导入"
        templateHeaders={templateHeaders}
        templateFileName="应急预案导入模板"
        onImport={handleImport}
        onSuccess={() => {
          fetchPlans()
          setShowImportDialog(false)
        }}
      />
    </div>
  )
}
