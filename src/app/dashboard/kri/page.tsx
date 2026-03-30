'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2,
  Plus,
  Search,
  BarChart3,
  Activity
} from 'lucide-react'
import { kriStatusColors } from '@/lib/utils'

// 类型定义
interface KRIMonthlyData {
  id: string
  month: string
  value: number
  trend: 'up' | 'down' | 'stable'
  status: 'normal' | 'warning' | 'alert'
  notes?: string
}

interface KRI {
  id: string
  kri_no: string
  name: string
  linked_risk_no?: string
  description?: string
  formula?: string
  frequency: string
  unit?: string
  target?: number
  warning_threshold?: number
  alert_threshold?: number
  dept_id?: string
  department?: { id: string; name: string }
  monthly_data?: KRIMonthlyData[]
  _count?: { monthly_data: number }
}

interface KRIStats {
  total: number
  normal: number
  warning: number
  alert: number
  noData: number
}

// 状态标签映射
const statusLabels: Record<string, string> = {
  normal: '正常',
  warning: '关注',
  alert: '预警',
}

const frequencyLabels: Record<string, string> = {
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
  quarterly: '每季',
  yearly: '每年',
}

// 趋势图标
const TrendIcon = ({ trend }: { trend: string }) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-red-500" />
    case 'down':
      return <TrendingDown className="w-4 h-4 text-green-500" />
    default:
      return <Minus className="w-4 h-4 text-gray-400" />
  }
}

// 状态图标
const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'alert':
      return <AlertCircle className="w-5 h-5 text-red-500" />
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    default:
      return <CheckCircle2 className="w-5 h-5 text-green-500" />
  }
}

// 状态徽章
const StatusBadge = ({ status }: { status: string }) => {
  const colors = kriStatusColors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' }
  return (
    <Badge className={`${colors.bg} ${colors.text} flex items-center gap-1`}>
      <StatusIcon status={status} />
      {statusLabels[status] || status}
    </Badge>
  )
}

// 趋势图表组件
const KRIChart = ({ kri, data }: { kri: KRI; data: KRIMonthlyData[] }) => {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      month: d.month,
      value: parseFloat(d.value.toString()),
      status: d.status,
    }))
  }, [data])

  const target = kri.target !== undefined ? parseFloat(kri.target.toString()) : null
  const warning = kri.warning_threshold !== undefined ? parseFloat(kri.warning_threshold.toString()) : null
  const alert = kri.alert_threshold !== undefined ? parseFloat(kri.alert_threshold.toString()) : null

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            formatter={(value: number) => [`${value}${kri.unit ? ' ' + kri.unit : ''}`, '数值']}
          />
          <Legend />
          
          {/* 阈值参考线 */}
          {target !== null && (
            <ReferenceLine 
              y={target} 
              stroke="#10b981" 
              strokeDasharray="5 5" 
              label={{ value: `目标: ${target}`, fill: '#10b981', fontSize: 12 }}
            />
          )}
          {warning !== null && (
            <ReferenceLine 
              y={warning} 
              stroke="#f59e0b" 
              strokeDasharray="5 5" 
              label={{ value: `预警: ${warning}`, fill: '#f59e0b', fontSize: 12 }}
            />
          )}
          {alert !== null && (
            <ReferenceLine 
              y={alert} 
              stroke="#ef4444" 
              strokeDasharray="5 5" 
              label={{ value: `警戒: ${alert}`, fill: '#ef4444', fontSize: 12 }}
            />
          )}
          
          {/* 数据区域 */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.1}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            name={kri.name}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// KRI详情弹窗
const KRIDetailDialog = ({ kri, onDataUpdate }: { kri: KRI; onDataUpdate: () => void }) => {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'chart' | 'data'>('chart')
  const [monthData, setMonthData] = useState<KRIMonthlyData[]>([])
  const [, setLoading] = useState(false)
  const [newData, setNewData] = useState({ month: '', value: '', notes: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/kri/${kri.id}/data?months=24`)
      const result = await res.json()
      if (result.code === 0) {
        setMonthData(result.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch KRI data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, kri.id])

  const handleSubmitData = async () => {
    if (!newData.month || !newData.value) return
    
    try {
      const res = await fetch(`/api/kri/${kri.id}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: newData.month,
          value: parseFloat(newData.value),
          notes: newData.notes,
        }),
      })
      const result = await res.json()
      if (result.code === 0) {
        setNewData({ month: '', value: '', notes: '' })
        fetchData()
        onDataUpdate()
      }
    } catch (error) {
      console.error('Failed to submit KRI data:', error)
    }
  }

  const latestData = monthData[monthData.length - 1]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <BarChart3 className="w-4 h-4 mr-1" />
          详情
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{kri.name}</span>
            <span className="text-sm font-normal text-gray-500">({kri.kri_no})</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">责任部门:</span>
              <span className="ml-2">{kri.department?.name || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">监控频率:</span>
              <span className="ml-2">{frequencyLabels[kri.frequency] || kri.frequency}</span>
            </div>
            <div>
              <span className="text-gray-500">关联风险:</span>
              <span className="ml-2">{kri.linked_risk_no || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">单位:</span>
              <span className="ml-2">{kri.unit || '-'}</span>
            </div>
            {kri.formula && (
              <div className="col-span-2">
                <span className="text-gray-500">计算公式:</span>
                <span className="ml-2 font-mono bg-gray-100 px-2 py-0.5 rounded">{kri.formula}</span>
              </div>
            )}
            {kri.description && (
              <div className="col-span-2">
                <span className="text-gray-500">指标说明:</span>
                <span className="ml-2">{kri.description}</span>
              </div>
            )}
          </div>

          {/* 阈值信息 */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-green-600 mb-1">目标值</div>
                <div className="text-xl font-bold text-green-700">
                  {kri.target !== undefined ? kri.target : '-'}
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-yellow-600 mb-1">黄色预警线</div>
                <div className="text-xl font-bold text-yellow-700">
                  {kri.warning_threshold !== undefined ? kri.warning_threshold : '-'}
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-red-600 mb-1">红色警戒线</div>
                <div className="text-xl font-bold text-red-700">
                  {kri.alert_threshold !== undefined ? kri.alert_threshold : '-'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 当前状态 */}
          {latestData && (
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">最新数据 ({latestData.month}):</span>
                <span className="text-2xl font-bold">
                  {latestData.value}{kri.unit ? kri.unit : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={latestData.status} />
                <TrendIcon trend={latestData.trend} />
              </div>
            </div>
          )}

          {/* 标签切换 */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'chart' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              趋势图表
            </button>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <button
              onClick={() => setActiveTab('data')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'data' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              数据录入
            </button>
          </div>

          {/* 内容区域 */}
          {activeTab === 'chart' ? (
            <div>
              {monthData.length > 0 ? (
                <KRIChart kri={kri} data={monthData} />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  暂无历史数据
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* 录入表单 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>月份</Label>
                  <Input
                    type="month"
                    value={newData.month}
                    onChange={(e) => setNewData({ ...newData, month: e.target.value })}
                  />
                </div>
                <div>
                  <Label>数值</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newData.value}
                    onChange={(e) => setNewData({ ...newData, value: e.target.value })}
                    placeholder={`单位: ${kri.unit || '-'}`}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSubmitData} className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    录入数据
                  </Button>
                </div>
              </div>
              {newData.value && (
                <div>
                  <Label>备注</Label>
                  <Input
                    value={newData.notes}
                    onChange={(e) => setNewData({ ...newData, notes: e.target.value })}
                    placeholder="可选填"
                  />
                </div>
              )}

              {/* 历史数据表格 */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>月份</TableHead>
                      <TableHead>数值</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>趋势</TableHead>
                      <TableHead>备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...monthData].reverse().map((data) => (
                        <TableRow key={data.month}>
                          <TableCell>{data.month}</TableCell>
                          <TableCell className="font-medium">
                            {data.value}{kri.unit ? ' ' + kri.unit : ''}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={data.status} />
                          </TableCell>
                          <TableCell>
                            <TrendIcon trend={data.trend} />
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {data.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 主页面组件
export default function KRIPage() {
  const [kris, setKris] = useState<KRI[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [stats, setStats] = useState<KRIStats>({ total: 0, normal: 0, warning: 0, alert: 0, noData: 0 })
  
  // 创建对话框状态
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([])
  const [createForm, setCreateForm] = useState({
    name: '',
    linked_risk_no: '',
    description: '',
    formula: '',
    frequency: 'monthly',
    unit: '',
    target: '',
    warning_threshold: '',
    alert_threshold: '',
    dept_id: '',
  })

  const fetchKris = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      queryParams.set('page', page.toString())
      queryParams.set('pageSize', '10')
      queryParams.set('with_latest_data', 'true')
      if (search) queryParams.set('search', search)
      if (statusFilter) queryParams.set('status', statusFilter)

      const res = await fetch(`/api/kri?${queryParams.toString()}`)
      const data = await res.json()
      if (data.code === 0) {
        setKris(data.data.list)
        setTotalPages(data.data.totalPages)
        
        // 计算统计
        const list = data.data.list
        const withData = list.filter((k: KRI) => k.monthly_data && k.monthly_data.length > 0)
        setStats({
          total: list.length,
          normal: withData.filter((k: KRI) => k.monthly_data?.[0]?.status === 'normal').length,
          warning: withData.filter((k: KRI) => k.monthly_data?.[0]?.status === 'warning').length,
          alert: withData.filter((k: KRI) => k.monthly_data?.[0]?.status === 'alert').length,
          noData: list.filter((k: KRI) => !k.monthly_data || k.monthly_data.length === 0).length,
        })
      }
    } catch (error) {
      console.error('Failed to fetch KRI list:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKris()
  }, [page, statusFilter])

  const handleSearch = () => {
    setPage(1)
    fetchKris()
  }

  const openCreateDialog = () => {
    setCreateForm({
      name: '',
      linked_risk_no: '',
      description: '',
      formula: '',
      frequency: 'monthly',
      unit: '',
      target: '',
      warning_threshold: '',
      alert_threshold: '',
      dept_id: '',
    })
    fetchDepartments()
    setShowCreateDialog(true)
  }

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments')
      const data = await res.json()
      if (data.code === 0) {
        setDepartments(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const handleCreateKRI = async () => {
    try {
      const res = await fetch('/api/kri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          target: createForm.target ? parseFloat(createForm.target) : null,
          warning_threshold: createForm.warning_threshold ? parseFloat(createForm.warning_threshold) : null,
          alert_threshold: createForm.alert_threshold ? parseFloat(createForm.alert_threshold) : null,
        }),
      })

      const data = await res.json()
      if (data.code === 0) {
        setShowCreateDialog(false)
        fetchKris()
      } else {
        alert(data.message || '创建失败')
      }
    } catch (error) {
      alert('网络错误')
    }
  }

  // 获取KRI当前状态
  const getKRIStatus = (kri: KRI): { status: string; value?: number; month?: string } => {
    if (!kri.monthly_data || kri.monthly_data.length === 0) {
      return { status: 'noData' }
    }
    const latest = kri.monthly_data[0]
    return {
      status: latest.status,
      value: parseFloat(latest.value.toString()),
      month: latest.month,
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">KRI监控预警</h2>
          <p className="text-gray-500">关键风险指标实时监控与预警管理</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-1" />
          新增KRI
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">KRI总数</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">正常</p>
              <p className="text-2xl font-bold text-green-700">{stats.normal}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">关注</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.warning}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">预警</p>
              <p className="text-2xl font-bold text-red-700">{stats.alert}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">无数据</p>
              <p className="text-2xl font-bold text-gray-700">{stats.noData}</p>
            </div>
            <Minus className="w-8 h-8 text-gray-400" />
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜索KRI名称、编号..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="w-4 h-4 mr-1" />
                搜索
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={statusFilter === '' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('')}
              >
                全部
              </Button>
              <Button 
                variant={statusFilter === 'normal' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('normal')}
                className="text-green-600"
              >
                正常
              </Button>
              <Button 
                variant={statusFilter === 'warning' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('warning')}
                className="text-yellow-600"
              >
                关注
              </Button>
              <Button 
                variant={statusFilter === 'alert' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter('alert')}
                className="text-red-600"
              >
                预警
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KRI列表 */}
      <Card>
        <CardHeader>
          <CardTitle>KRI指标列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>编号</TableHead>
                    <TableHead>指标名称</TableHead>
                    <TableHead>关联风险</TableHead>
                    <TableHead>责任部门</TableHead>
                    <TableHead>最新数值</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>趋势</TableHead>
                    <TableHead>数据点</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kris.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                        暂无KRI指标
                      </TableCell>
                    </TableRow>
                  ) : (
                    kris.map((kri) => {
                      const statusInfo = getKRIStatus(kri)
                      return (
                        <TableRow key={kri.id}>
                          <TableCell className="font-medium">{kri.kri_no}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{kri.name}</div>
                              {kri.unit && (
                                <div className="text-xs text-gray-500">单位: {kri.unit}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{kri.linked_risk_no || '-'}</TableCell>
                          <TableCell>{kri.department?.name || '-'}</TableCell>
                          <TableCell>
                            {statusInfo.value !== undefined ? (
                              <div>
                                <span className="font-medium">{statusInfo.value}</span>
                                {kri.unit && <span className="text-xs text-gray-500 ml-1">{kri.unit}</span>}
                                {statusInfo.month && (
                                  <div className="text-xs text-gray-400">{statusInfo.month}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {statusInfo.status === 'noData' ? (
                              <Badge variant="secondary">无数据</Badge>
                            ) : (
                              <StatusBadge status={statusInfo.status} />
                            )}
                          </TableCell>
                          <TableCell>
                            {kri.monthly_data?.[0] && (
                              <TrendIcon trend={kri.monthly_data[0].trend} />
                            )}
                          </TableCell>
                          <TableCell>{kri._count?.monthly_data || 0}</TableCell>
                          <TableCell>
                            <KRIDetailDialog kri={kri} onDataUpdate={fetchKris} />
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* 创建KRI对话框 */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">新增KRI指标</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateDialog(false)}>
                <Plus className="w-4 h-4 rotate-45" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>指标名称 *</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="如：VOCs排放浓度"
                />
              </div>

              <div className="space-y-2">
                <Label>关联风险编号</Label>
                <Input
                  value={createForm.linked_risk_no}
                  onChange={(e) => setCreateForm({...createForm, linked_risk_no: e.target.value})}
                  placeholder="如：S-001"
                />
              </div>

              <div className="space-y-2">
                <Label>指标说明</Label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md min-h-[60px]"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  placeholder="描述该指标的含义和用途"
                />
              </div>

              <div className="space-y-2">
                <Label>计算公式/数据来源</Label>
                <Input
                  value={createForm.formula}
                  onChange={(e) => setCreateForm({...createForm, formula: e.target.value})}
                  placeholder="如：RTO出口VOCs浓度监测值"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>监测频率</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={createForm.frequency}
                    onChange={(e) => setCreateForm({...createForm, frequency: e.target.value})}
                  >
                    <option value="daily">每日</option>
                    <option value="weekly">每周</option>
                    <option value="monthly">每月</option>
                    <option value="quarterly">每季度</option>
                    <option value="yearly">每年</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>单位</Label>
                  <Input
                    value={createForm.unit}
                    onChange={(e) => setCreateForm({...createForm, unit: e.target.value})}
                    placeholder="如：mg/m³"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>目标值</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={createForm.target}
                    onChange={(e) => setCreateForm({...createForm, target: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>黄色预警线</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={createForm.warning_threshold}
                    onChange={(e) => setCreateForm({...createForm, warning_threshold: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>红色警戒线</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={createForm.alert_threshold}
                    onChange={(e) => setCreateForm({...createForm, alert_threshold: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>责任部门</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={createForm.dept_id}
                  onChange={(e) => setCreateForm({...createForm, dept_id: e.target.value})}
                >
                  <option value="">请选择部门</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                取消
              </Button>
              <Button onClick={handleCreateKRI} disabled={!createForm.name}>
                创建
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
