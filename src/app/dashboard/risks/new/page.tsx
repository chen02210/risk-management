'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { riskCategoryLabel, calculateRiskLevel } from '@/lib/utils'

const categories = [
  { value: 'safety', label: '安全环保' },
  { value: 'production', label: '生产运营' },
  { value: 'quality', label: '质量' },
  { value: 'supply_chain', label: '供应链' },
  { value: 'financial', label: '财务' },
  { value: 'compliance', label: '合规' },
  { value: 'information', label: '信息安全' },
]

const strategies = [
  { value: 'avoid', label: '规避' },
  { value: 'reduce', label: '降低' },
  { value: 'transfer', label: '转移' },
  { value: 'accept', label: '接受' },
]

export default function NewRiskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([])
  const [users, setUsers] = useState<{id: string, name: string}[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'safety',
    description: '',
    consequence: '',
    source: '',
    likelihood: 3,
    impact: 3,
    response_strategy: 'reduce',
    dept_id: '',
    owner_id: '',
    next_evaluate_at: '',
  })

  const riskValue = formData.likelihood * formData.impact
  const riskLevel = calculateRiskLevel(riskValue)

  useEffect(() => {
    fetchDepartments()
    fetchUsers()
  }, [])

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

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (data.code === 0) {
        setUsers(data.data.list)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.code === 0) {
        router.push('/dashboard/risks')
      } else {
        alert(data.message || '创建失败')
      }
    } catch (error) {
      alert('网络错误')
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      '低': 'bg-green-100 text-green-800',
      '中': 'bg-yellow-100 text-yellow-800',
      '高': 'bg-orange-100 text-orange-800',
      '极高': 'bg-red-100 text-red-800',
    }
    return colors[level] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">新增风险</h2>
          <p className="text-gray-500">登记新的风险信息</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>返回</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">风险名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="请输入风险名称"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">风险类别 *</Label>
              <select
                id="category"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">风险来源</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={e => setFormData({...formData, source: e.target.value})}
                placeholder="如：生产工艺、设备设施等"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">风险描述</Label>
              <textarea
                id="description"
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="详细描述风险情况"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="consequence">潜在后果</Label>
              <textarea
                id="consequence"
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                value={formData.consequence}
                onChange={e => setFormData({...formData, consequence: e.target.value})}
                placeholder="描述风险发生后的潜在影响"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>风险评估</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>可能性 (1-5)</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={`w-10 h-10 rounded ${formData.likelihood === n ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                        onClick={() => setFormData({...formData, likelihood: n})}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>影响程度 (1-5)</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={`w-10 h-10 rounded ${formData.impact === n ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                        onClick={() => setFormData({...formData, impact: n})}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-2">风险值</div>
                <div className="text-4xl font-bold text-blue-600">{riskValue}</div>
                <Badge className={`mt-2 ${getRiskLevelColor(riskLevel)}`}>
                  {riskLevel}风险
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="response_strategy">应对策略</Label>
                <select
                  id="response_strategy"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.response_strategy}
                  onChange={e => setFormData({...formData, response_strategy: e.target.value})}
                >
                  {strategies.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>责任分配</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dept_id">责任部门</Label>
              <select
                id="dept_id"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={formData.dept_id}
                onChange={e => setFormData({...formData, dept_id: e.target.value})}
              >
                <option value="">请选择部门</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_id">责任人</Label>
              <select
                id="owner_id"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={formData.owner_id}
                onChange={e => setFormData({...formData, owner_id: e.target.value})}
              >
                <option value="">请选择责任人</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_evaluate_at">下次评估日期</Label>
              <Input
                id="next_evaluate_at"
                type="date"
                value={formData.next_evaluate_at}
                onChange={e => setFormData({...formData, next_evaluate_at: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '保存中...' : '保存风险'}
          </Button>
        </div>
      </form>
    </div>
  )
}
