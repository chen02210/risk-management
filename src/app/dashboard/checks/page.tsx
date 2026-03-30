'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { AlertTriangle, CheckCircle, XCircle, MinusCircle, Clock, Plus, Search, Edit, Trash2, X } from 'lucide-react'

interface RiskCheck {
  id: string
  check_no: string
  area: string | null
  category: string | null
  check_item: string
  standard: string | null
  method: string | null
  result: 'pass' | 'fail' | 'na' | null
  issue_desc: string | null
  risk_level: string | null
  measure: string | null
  deadline: string | null
  verify_date: string | null
  verify_result: 'passed' | 'failed' | 'pending' | null
  verifier: string | null
  check_date: string
  checker: string | null
  owner: {
    id: string
    name: string
  } | null
}

interface ChecksResponse {
  code: number
  message: string
  data: {
    list: RiskCheck[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  timestamp: number
}

const resultFilters = [
  { value: 'all', label: '全部' },
  { value: 'pass', label: '合格' },
  { value: 'fail', label: '不合格' },
  { value: 'na', label: '不适用' },
  { value: 'pending', label: '待整改' },
  { value: 'overdue', label: '已逾期' },
]

// 检查结果标签和颜色
const checkResultLabels: Record<string, string> = {
  pass: '合格',
  fail: '不合格',
  na: '不适用',
}

const checkResultColors: Record<string, string> = {
  pass: 'bg-green-100 text-green-800',
  fail: 'bg-red-100 text-red-800',
  na: 'bg-gray-100 text-gray-800',
}

// 验收结果标签和颜色
const verifyResultLabels: Record<string, string> = {
  passed: '已通过',
  failed: '未通过',
  pending: '待验收',
}

const verifyResultColors: Record<string, string> = {
  passed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
}

// 风险等级颜色
const riskLevelColors: Record<string, string> = {
  '低': 'bg-green-100 text-green-800',
  '中': 'bg-yellow-100 text-yellow-800',
  '高': 'bg-orange-100 text-orange-800',
  '极高': 'bg-red-100 text-red-800',
}

interface User {
  id: string
  name: string
}

export default function ChecksPage() {
  const [checks, setChecks] = useState<RiskCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [resultFilter, setResultFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // 对话框状态
  const [showDialog, setShowDialog] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    area: '',
    category: '',
    check_item: '',
    standard: '',
    method: '',
    check_date: new Date().toISOString().split('T')[0],
    checker: '',
    result: '' as 'pass' | 'fail' | 'na' | '',
    issue_desc: '',
    risk_level: '',
    measure: '',
    owner_id: '',
    deadline: '',
  })

  const fetchChecks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('pageSize', '10')
      
      // 处理筛选参数
      if (resultFilter === 'pending') {
        params.append('pending_verify', 'true')
      } else if (resultFilter === 'overdue') {
        params.append('overdue', 'true')
      } else if (resultFilter !== 'all') {
        params.append('result', resultFilter)
      }
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const res = await fetch(`/api/checks?${params.toString()}`)
      const data: ChecksResponse = await res.json()
      if (data.code === 0) {
        setChecks(data.data.list)
        setTotalPages(data.data.totalPages)
        setTotal(data.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch checks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChecks()
  }, [page, resultFilter])

  // 计算统计数据
  const stats = useMemo(() => {
    const totalCount = checks.length
    const passCount = checks.filter(c => c.result === 'pass').length
    const failCount = checks.filter(c => c.result === 'fail').length
    const pendingCount = checks.filter(c => 
      c.result === 'fail' && (!c.verify_result || c.verify_result === 'pending')
    ).length
    
    // 计算逾期数（整改期限已过但未验收或验收未通过）
    const now = new Date()
    const overdueCount = checks.filter(c => {
      if (!c.deadline) return false
      if (c.verify_result === 'passed') return false
      return new Date(c.deadline) < now
    }).length

    return {
      totalCount,
      passCount,
      failCount,
      pendingCount,
      overdueCount,
    }
  }, [checks])

  // 获取结果标签
  const getResultBadge = (result: string | null) => {
    if (!result) return <Badge className="bg-gray-100 text-gray-800">未检查</Badge>
    const className = checkResultColors[result] || 'bg-gray-100 text-gray-800'
    const label = checkResultLabels[result] || result
    return <Badge className={className}>{label}</Badge>
  }

  // 获取验收状态标签
  const getVerifyBadge = (check: RiskCheck) => {
    if (check.result !== 'fail') return '-'
    if (!check.verify_result) {
      return <Badge className="bg-gray-100 text-gray-800">待整改</Badge>
    }
    const className = verifyResultColors[check.verify_result] || 'bg-gray-100 text-gray-800'
    const label = verifyResultLabels[check.verify_result] || check.verify_result
    return <Badge className={className}>{label}</Badge>
  }

  // 获取风险等级标签
  const getRiskLevelBadge = (level: string | null) => {
    if (!level) return '-'
    const className = riskLevelColors[level] || 'bg-gray-100 text-gray-800'
    return <Badge className={className}>{level}</Badge>
  }

  // 检查是否逾期
  const isOverdue = (check: RiskCheck) => {
    if (!check.deadline || check.verify_result === 'passed') return false
    return new Date(check.deadline) < new Date()
  }

  // 计算距离整改期限的天数
  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null
    const diff = new Date(deadline).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const handleSearch = () => {
    setPage(1)
    fetchChecks()
  }

  const openCreateDialog = () => {
    setFormData({
      area: '',
      category: '',
      check_item: '',
      standard: '',
      method: '',
      check_date: new Date().toISOString().split('T')[0],
      checker: '',
      result: '',
      issue_desc: '',
      risk_level: '',
      measure: '',
      owner_id: '',
      deadline: '',
    })
    fetchUsers()
    setShowDialog(true)
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users?pageSize=100')
      const data = await res.json()
      if (data.code === 0) {
        setUsers(data.data.list)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.code === 0) {
        setShowDialog(false)
        fetchChecks()
      } else {
        alert(data.message || '创建失败')
      }
    } catch (error) {
      alert('网络错误')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条检查记录吗？')) return
    
    try {
      const res = await fetch(`/api/checks/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.code === 0) {
        fetchChecks()
      } else {
        alert(data.message || '删除失败')
      }
    } catch (error) {
      alert('删除失败')
    }
  }

  if (loading && checks.length === 0) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">风险检查表</h2>
          <p className="text-gray-500">定期检查记录和问题整改进度跟踪</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          新增检查
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{stats.totalCount}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">总检查数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.passCount}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">合格数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{stats.failCount}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">不合格数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">待整改数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{stats.overdueCount}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">逾期数</p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">结果筛选</Label>
              <div className="flex flex-wrap gap-2">
                {resultFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={resultFilter === filter.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setResultFilter(filter.value)
                      setPage(1)
                    }}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <Label className="text-sm font-medium mb-2 block">搜索</Label>
                <Input
                  placeholder="搜索检查编号、检查项..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-64"
                />
              </div>
              <Button variant="outline" onClick={handleSearch}>搜索</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 检查记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>检查记录列表 ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>检查编号</TableHead>
                  <TableHead>检查日期</TableHead>
                  <TableHead>检查区域</TableHead>
                  <TableHead>检查项目</TableHead>
                  <TableHead>检查结果</TableHead>
                  <TableHead>风险等级</TableHead>
                  <TableHead>整改期限</TableHead>
                  <TableHead>验收状态</TableHead>
                  <TableHead>整改负责人</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map((check) => {
                  const overdue = isOverdue(check)
                  const daysUntil = getDaysUntilDeadline(check.deadline)
                  
                  return (
                    <TableRow key={check.id}>
                      <TableCell className="font-medium">
                        {check.check_no}
                      </TableCell>
                      <TableCell>{formatDate(check.check_date)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{check.area || '-'}</div>
                          {check.category && (
                            <div className="text-xs text-gray-500">{check.category}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={check.check_item}>
                          {check.check_item}
                        </div>
                        {check.issue_desc && (
                          <div className="text-xs text-red-500 truncate mt-1" title={check.issue_desc}>
                            问题: {check.issue_desc}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getResultBadge(check.result)}</TableCell>
                      <TableCell>{getRiskLevelBadge(check.risk_level)}</TableCell>
                      <TableCell>
                        {check.deadline ? (
                          <div>
                            <div className={overdue ? 'text-red-600 font-medium' : ''}>
                              {formatDate(check.deadline)}
                            </div>
                            {daysUntil !== null && (
                              <div className={`text-xs ${
                                overdue 
                                  ? 'text-red-600 font-medium' 
                                  : daysUntil <= 3 
                                    ? 'text-orange-500' 
                                    : 'text-gray-500'
                              }`}>
                                {overdue 
                                  ? `已逾期 ${Math.abs(daysUntil)} 天` 
                                  : `剩余 ${daysUntil} 天`
                                }
                              </div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getVerifyBadge(check)}
                          {overdue && (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {check.owner ? (
                          <div>
                            <div className="font-medium">{check.owner.name}</div>
                            {check.checker && (
                              <div className="text-xs text-gray-500">
                                检查人: {check.checker}
                              </div>
                            )}
                          </div>
                        ) : (
                          check.checker || '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(check.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              第 {page} 页，共 {totalPages} 页，共 {total} 条记录
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

      {/* 创建检查对话框 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">新增检查</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDialog(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>检查区域</Label>
                  <Input
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    placeholder="如：生产车间"
                  />
                </div>
                <div className="space-y-2">
                  <Label>风险类别</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="如：安全环保"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>检查项目 *</Label>
                <Input
                  value={formData.check_item}
                  onChange={(e) => setFormData({...formData, check_item: e.target.value})}
                  placeholder="请输入检查项目"
                />
              </div>

              <div className="space-y-2">
                <Label>检查标准</Label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md min-h-[60px]"
                  value={formData.standard}
                  onChange={(e) => setFormData({...formData, standard: e.target.value})}
                  placeholder="检查依据的标准"
                />
              </div>

              <div className="space-y-2">
                <Label>检查方法</Label>
                <Input
                  value={formData.method}
                  onChange={(e) => setFormData({...formData, method: e.target.value})}
                  placeholder="如：现场检查、资料查阅"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>检查日期 *</Label>
                  <Input
                    type="date"
                    value={formData.check_date}
                    onChange={(e) => setFormData({...formData, check_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>检查人</Label>
                  <Input
                    value={formData.checker}
                    onChange={(e) => setFormData({...formData, checker: e.target.value})}
                    placeholder="检查人姓名"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>检查结果 *</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'pass', label: '合格' },
                    { value: 'fail', label: '不合格' },
                    { value: 'na', label: '不适用' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`px-4 py-2 rounded border ${
                        formData.result === option.value
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                      onClick={() => setFormData({...formData, result: option.value as any})}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.result === 'fail' && (
                <>
                  <div className="space-y-2">
                    <Label>问题描述</Label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                      value={formData.issue_desc}
                      onChange={(e) => setFormData({...formData, issue_desc: e.target.value})}
                      placeholder="描述发现的问题"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>风险等级</Label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.risk_level}
                        onChange={(e) => setFormData({...formData, risk_level: e.target.value})}
                      >
                        <option value="">请选择</option>
                        <option value="低">低</option>
                        <option value="中">中</option>
                        <option value="高">高</option>
                        <option value="极高">极高</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>整改期限</Label>
                      <Input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>整改措施</Label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md min-h-[60px]"
                      value={formData.measure}
                      onChange={(e) => setFormData({...formData, measure: e.target.value})}
                      placeholder="整改措施说明"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>整改责任人</Label>
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
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.check_item || !formData.check_date || !formData.result}>
                创建
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
