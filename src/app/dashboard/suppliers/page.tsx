'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Calendar, TrendingUp, AlertTriangle, CheckCircle, Upload } from 'lucide-react'
import { ExcelImportDialog } from '@/components/ExcelImportDialog'
import { formatDate } from '@/lib/utils'

interface Supplier {
  id: string
  supplier_no: string
  name: string
  supply_category: string | null
  supply_items: string | null
  supply_share: number | null
  cooperation_years: number | null
  replaceability: number | null
  on_time_rate: number | null
  quality_rate: number | null
  price_competitiveness: number | null
  financial_stability: number | null
  service_cooperation: number | null
  total_score: number | null
  risk_level: string | null
  has_agreement: boolean | null
  agreement_expire: string | null
  improvement_require: string | null
  evaluator: string | null
  evaluate_date: string | null
  status: string
  created_at: string
}

interface SupplierFormData {
  name: string
  supplier_no: string
  supply_category: string
  supply_items: string
  supply_share: string
  cooperation_years: string
  replaceability: string
  on_time_rate: string
  quality_rate: string
  price_competitiveness: string
  financial_stability: string
  service_cooperation: string
  has_agreement: boolean
  agreement_expire: string
  improvement_require: string
  status: string
}

const initialFormData: SupplierFormData = {
  name: '',
  supplier_no: '',
  supply_category: '',
  supply_items: '',
  supply_share: '',
  cooperation_years: '',
  replaceability: '',
  on_time_rate: '',
  quality_rate: '',
  price_competitiveness: '',
  financial_stability: '',
  service_cooperation: '',
  has_agreement: false,
  agreement_expire: '',
  improvement_require: '',
  status: 'active',
}

// 计算综合得分
function calculateTotalScore(formData: SupplierFormData): number {
  const onTimeRate = parseFloat(formData.on_time_rate) || 0
  const qualityRate = parseFloat(formData.quality_rate) || 0
  const priceCompetitiveness = parseInt(formData.price_competitiveness) || 0
  const financialStability = parseInt(formData.financial_stability) || 0
  const serviceCooperation = parseInt(formData.service_cooperation) || 0

  // 权重：交期达成率30%，质量合格率30%，价格竞争力20%，财务稳定性10%，服务配合度10%
  const score = (onTimeRate * 0.3) + (qualityRate * 0.3) + (priceCompetitiveness * 2) + (financialStability * 2) + (serviceCooperation * 2)
  
  return Math.round(score * 100) / 100
}

// 计算风险等级
function calculateRiskLevel(totalScore: number): string {
  if (totalScore >= 85) return '低'
  if (totalScore >= 70) return '中'
  if (totalScore >= 50) return '高'
  return '极高'
}

// 获取风险等级颜色
function getRiskLevelColors(level: string | null) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    '低': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    '中': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    '高': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    '极高': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  }
  return colors[level || ''] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
}

// 获取状态标签
function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    blacklisted: 'bg-red-100 text-red-800',
  }
  const labels: Record<string, string> = {
    active: '合作中',
    inactive: '已停用',
    blacklisted: '黑名单',
  }
  return <Badge className={styles[status] || ''}>{labels[status] || status}</Badge>
}

// 检查协议是否即将到期（30天内）
function isExpiringSoon(expireDate: string | null): boolean {
  if (!expireDate) return false
  const today = new Date()
  const expire = new Date(expireDate)
  const diffTime = expire.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 && diffDays <= 30
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData)
  const [filterRiskLevel, setFilterRiskLevel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('active')
  const [expiringCount, setExpiringCount] = useState(0)
  const [activeTab, setActiveTab] = useState('list')
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  useEffect(() => {
    fetchSuppliers()
    fetchExpiringCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterRiskLevel, filterStatus])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      let url = `/api/suppliers?page=${page}&pageSize=10`
      if (filterRiskLevel && filterRiskLevel !== 'all') url += `&risk_level=${filterRiskLevel}`
      if (filterStatus && filterStatus !== 'all') url += `&status=${filterStatus}`
      
      const res = await fetch(url)
      const data = await res.json()
      if (data.code === 0) {
        setSuppliers(data.data.list)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExpiringCount = async () => {
    try {
      const res = await fetch('/api/suppliers?expiring_soon=true&pageSize=100')
      const data = await res.json()
      if (data.code === 0) {
        setExpiringCount(data.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch expiring count:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers'
    const method = editingSupplier ? 'PUT' : 'POST'
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.code === 0) {
        setDialogOpen(false)
        setFormData(initialFormData)
        setEditingSupplier(null)
        fetchSuppliers()
        fetchExpiringCount()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Failed to save supplier:', error)
      alert('保存失败')
    }
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      supplier_no: supplier.supplier_no,
      supply_category: supplier.supply_category || '',
      supply_items: supplier.supply_items || '',
      supply_share: supplier.supply_share?.toString() || '',
      cooperation_years: supplier.cooperation_years?.toString() || '',
      replaceability: supplier.replaceability?.toString() || '',
      on_time_rate: supplier.on_time_rate?.toString() || '',
      quality_rate: supplier.quality_rate?.toString() || '',
      price_competitiveness: supplier.price_competitiveness?.toString() || '',
      financial_stability: supplier.financial_stability?.toString() || '',
      service_cooperation: supplier.service_cooperation?.toString() || '',
      has_agreement: supplier.has_agreement || false,
      agreement_expire: supplier.agreement_expire ? supplier.agreement_expire.split('T')[0] : '',
      improvement_require: supplier.improvement_require || '',
      status: supplier.status,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该供应商吗？')) return
    
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.code === 0) {
        fetchSuppliers()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Failed to delete supplier:', error)
      alert('删除失败')
    }
  }

  const handleImport = async (data: any[]) => {
    try {
      const res = await fetch('/api/suppliers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      const result = await res.json()
      if (result.code === 0) {
        fetchSuppliers()
        fetchExpiringCount()
      }
      return result.data
    } catch (error) {
      console.error('Import error:', error)
      return { success: 0, error: data.length, errors: ['导入请求失败'] }
    }
  }

  const templateHeaders = [
    '供应商名称',
    '供应物料类别',
    '具体供应品种',
    '供应份额(%)',
    '合作年限',
    '交期达成率(%)',
    '质量合格率(%)',
    '价格竞争力(1-5)',
    '财务稳健性(1-5)',
    '服务配合度(1-5)',
    '有框架协议',
    '协议到期日',
    '评估人',
  ]

  const handleEvaluate = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      ...initialFormData,
      name: supplier.name,
      supplier_no: supplier.supplier_no,
      supply_category: supplier.supply_category || '',
      supply_items: supplier.supply_items || '',
      supply_share: supplier.supply_share?.toString() || '',
      cooperation_years: supplier.cooperation_years?.toString() || '',
      replaceability: supplier.replaceability?.toString() || '',
      has_agreement: supplier.has_agreement || false,
      agreement_expire: supplier.agreement_expire ? supplier.agreement_expire.split('T')[0] : '',
      status: supplier.status,
    })
    setActiveTab('evaluate')
    setDialogOpen(true)
  }

  const currentTotalScore = calculateTotalScore(formData)
  const currentRiskLevel = calculateRiskLevel(currentTotalScore)
  const riskColors = getRiskLevelColors(currentRiskLevel)

  // 统计数据
  const stats = {
    total: suppliers.length,
    lowRisk: suppliers.filter(s => s.risk_level === '低').length,
    mediumRisk: suppliers.filter(s => s.risk_level === '中').length,
    highRisk: suppliers.filter(s => s.risk_level === '高' || s.risk_level === '极高').length,
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">供应商总数</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">低风险供应商</p>
                <p className="text-2xl font-bold text-green-600">{stats.lowRisk}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">中风险供应商</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.mediumRisk}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">协议即将到期</p>
                <p className="text-2xl font-bold text-red-600">{expiringCount}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 协议到期提醒 */}
      {expiringCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <p className="text-orange-800">
                有 <span className="font-bold">{expiringCount}</span> 家供应商的协议将在30天内到期，请及时跟进续约事宜。
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 主内容区 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>供应商风险管理</CardTitle>
              <CardDescription>供应商评估、风险监控和协议管理</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                批量导入
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingSupplier(null)
                    setFormData(initialFormData)
                    setActiveTab('list')
                  }}>
                    新增供应商
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSupplier ? (activeTab === 'evaluate' ? '供应商风险评估' : '编辑供应商') : '新增供应商'}
                  </DialogTitle>
                </DialogHeader>
                
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className={editingSupplier && activeTab === 'evaluate' ? 'hidden' : ''}>
                    <TabsTrigger value="basic">基本信息</TabsTrigger>
                    <TabsTrigger value="evaluate">风险评估</TabsTrigger>
                  </TabsList>
                  
                  <form onSubmit={handleSubmit}>
                    <TabsContent value="basic" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">供应商名称 *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supplier_no">供应商编号</Label>
                          <Input
                            id="supplier_no"
                            value={formData.supplier_no}
                            onChange={(e) => setFormData({ ...formData, supplier_no: e.target.value })}
                            placeholder="系统自动生成"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="supply_category">供应类别</Label>
                          <Input
                            id="supply_category"
                            value={formData.supply_category}
                            onChange={(e) => setFormData({ ...formData, supply_category: e.target.value })}
                            placeholder="如：原材料、零部件等"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supply_share">供应占比 (%)</Label>
                          <Input
                            id="supply_share"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.supply_share}
                            onChange={(e) => setFormData({ ...formData, supply_share: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="supply_items">供应物料/服务</Label>
                        <Textarea
                          id="supply_items"
                          value={formData.supply_items}
                          onChange={(e) => setFormData({ ...formData, supply_items: e.target.value })}
                          placeholder="详细描述供应的物料或服务内容"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cooperation_years">合作年限</Label>
                          <Input
                            id="cooperation_years"
                            type="number"
                            min="0"
                            value={formData.cooperation_years}
                            onChange={(e) => setFormData({ ...formData, cooperation_years: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="replaceability">可替代性评分 (1-5)</Label>
                          <Select
                            value={formData.replaceability}
                            onValueChange={(value) => setFormData({ ...formData, replaceability: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择评分" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 - 极易替代</SelectItem>
                              <SelectItem value="2">2 - 较易替代</SelectItem>
                              <SelectItem value="3">3 - 中等难度</SelectItem>
                              <SelectItem value="4">4 - 较难替代</SelectItem>
                              <SelectItem value="5">5 - 极难替代</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="has_agreement">是否有协议</Label>
                          <Select
                            value={formData.has_agreement ? 'true' : 'false'}
                            onValueChange={(value) => setFormData({ ...formData, has_agreement: value === 'true' })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">是</SelectItem>
                              <SelectItem value="false">否</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="agreement_expire">协议到期日</Label>
                          <Input
                            id="agreement_expire"
                            type="date"
                            value={formData.agreement_expire}
                            onChange={(e) => setFormData({ ...formData, agreement_expire: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="status">状态</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">合作中</SelectItem>
                            <SelectItem value="inactive">已停用</SelectItem>
                            <SelectItem value="blacklisted">黑名单</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="evaluate" className="space-y-4 mt-4">
                      <Card className="border-blue-200">
                        <CardContent className="p-4">
                          <h4 className="font-medium text-blue-800 mb-2">评估说明</h4>
                          <p className="text-sm text-blue-600">
                            请根据供应商的实际表现进行评分。综合得分将自动计算，权重分配如下：<br/>
                            交期达成率 30% | 质量合格率 30% | 价格竞争力 20% | 财务稳定性 10% | 服务配合度 10%
                          </p>
                        </CardContent>
                      </Card>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="on_time_rate">交期达成率 (%)</Label>
                          <Input
                            id="on_time_rate"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.on_time_rate}
                            onChange={(e) => setFormData({ ...formData, on_time_rate: e.target.value })}
                            placeholder="0-100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quality_rate">质量合格率 (%)</Label>
                          <Input
                            id="quality_rate"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.quality_rate}
                            onChange={(e) => setFormData({ ...formData, quality_rate: e.target.value })}
                            placeholder="0-100"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price_competitiveness">价格竞争力 (1-10)</Label>
                          <Input
                            id="price_competitiveness"
                            type="number"
                            min="1"
                            max="10"
                            value={formData.price_competitiveness}
                            onChange={(e) => setFormData({ ...formData, price_competitiveness: e.target.value })}
                            placeholder="1-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="financial_stability">财务稳定性 (1-10)</Label>
                          <Input
                            id="financial_stability"
                            type="number"
                            min="1"
                            max="10"
                            value={formData.financial_stability}
                            onChange={(e) => setFormData({ ...formData, financial_stability: e.target.value })}
                            placeholder="1-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="service_cooperation">服务配合度 (1-10)</Label>
                          <Input
                            id="service_cooperation"
                            type="number"
                            min="1"
                            max="10"
                            value={formData.service_cooperation}
                            onChange={(e) => setFormData({ ...formData, service_cooperation: e.target.value })}
                            placeholder="1-10"
                          />
                        </div>
                      </div>
                      
                      {/* 实时评分展示 */}
                      <Card className={`${riskColors.bg} ${riskColors.border} border`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">综合得分</p>
                              <p className="text-3xl font-bold">{currentTotalScore.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">风险等级</p>
                              <span className={`inline-block px-3 py-1 rounded-full text-lg font-bold ${riskColors.bg} ${riskColors.text}`}>
                                {currentRiskLevel}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="space-y-2">
                        <Label htmlFor="improvement_require">改进要求</Label>
                        <Textarea
                          id="improvement_require"
                          value={formData.improvement_require}
                          onChange={(e) => setFormData({ ...formData, improvement_require: e.target.value })}
                          placeholder="针对评估结果提出的改进要求和建议"
                        />
                      </div>
                    </TabsContent>
                    
                    <DialogFooter className="mt-6">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        取消
                      </Button>
                      <Button type="submit">
                        {editingSupplier ? '保存修改' : '创建供应商'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* 筛选器 */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={filterRiskLevel} onValueChange={setFilterRiskLevel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="风险等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部等级</SelectItem>
                <SelectItem value="低">低风险</SelectItem>
                <SelectItem value="中">中风险</SelectItem>
                <SelectItem value="高">高风险</SelectItem>
                <SelectItem value="极高">极高风险</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">合作中</SelectItem>
                <SelectItem value="inactive">已停用</SelectItem>
                <SelectItem value="blacklisted">黑名单</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => { setFilterRiskLevel(''); setFilterStatus('') }}>
              重置筛选
            </Button>
          </div>
          
          {/* 供应商列表 */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>编号</TableHead>
                <TableHead>供应商名称</TableHead>
                <TableHead>供应类别</TableHead>
                <TableHead>综合得分</TableHead>
                <TableHead>风险等级</TableHead>
                <TableHead>供应占比</TableHead>
                <TableHead>协议状态</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>评估日期</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => {
                const colors = getRiskLevelColors(supplier.risk_level)
                const expiring = isExpiringSoon(supplier.agreement_expire)
                return (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.supplier_no}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        {supplier.supply_items && (
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{supplier.supply_items}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{supplier.supply_category || '-'}</TableCell>
                    <TableCell>
                      <span className="font-medium">{supplier.total_score?.toFixed(2) || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {supplier.risk_level || '未评估'}
                      </span>
                    </TableCell>
                    <TableCell>{supplier.supply_share ? `${supplier.supply_share}%` : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {supplier.has_agreement ? (
                          <>
                            <span className="text-green-600">有协议</span>
                            {expiring && (
                              <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                                即将到期
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">无协议</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                    <TableCell>{formatDate(supplier.evaluate_date)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(supplier)}>
                          编辑
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEvaluate(supplier)}>
                          评估
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(supplier.id)}>
                          删除
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

      {/* Excel导入对话框 */}
      <ExcelImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="供应商导入"
        templateHeaders={templateHeaders}
        templateFileName="供应商导入模板"
        onImport={handleImport}
        onSuccess={() => {
          setImportDialogOpen(false)
        }}
      />
    </div>
  )
}
