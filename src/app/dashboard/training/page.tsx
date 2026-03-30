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
import { Calendar, Users, BookOpen, TrendingUp, Star, Award, Clock, Upload } from 'lucide-react'
import { ExcelImportDialog } from '@/components/ExcelImportDialog'
import { formatDate, trainingCategoryLabels, trainingLevelLabels, trainingMethodLabels, instructorSourceLabels, examMethodLabels, getEffectScoreColor, getPassRateColor } from '@/lib/utils'

interface Training {
  id: string
  training_no: string
  training_date: string
  topic: string
  category: string | null
  level: string | null
  target_dept: string | null
  plan_count: number | null
  actual_count: number | null
  hours: number | null
  instructor: string | null
  instructor_source: string | null
  method: string | null
  material: string | null
  exam_method: string | null
  pass_rate: number | null
  effect_score: number | null
  feedback: string | null
  improvement: string | null
  remark: string | null
  created_at: string
}

interface QuarterStat {
  quarter: string
  count: number
  person_times: number
  hours: number
  avg_pass_rate: number | null
  avg_effect_score: number | null
}

interface TrainingStats {
  year: number
  summary: {
    total_trainings: number
    total_person_times: number
    total_plan_count: number
    total_hours: number
    avg_pass_rate: number
    avg_effect_score: number
    attendance_rate: number
  }
  quarter_stats: QuarterStat[]
  category_stats: Record<string, { count: number; person_times: number; hours: number }>
  method_stats: Record<string, { count: number; person_times: number }>
  instructor_stats: Record<string, { count: number; person_times: number }>
}

interface TrainingFormData {
  training_date: string
  topic: string
  category: string
  level: string
  target_dept: string
  plan_count: string
  actual_count: string
  hours: string
  instructor: string
  instructor_source: string
  method: string
  material: string
  exam_method: string
  pass_rate: string
  effect_score: string
  feedback: string
  improvement: string
  remark: string
}

const initialFormData: TrainingFormData = {
  training_date: '',
  topic: '',
  category: '',
  level: '',
  target_dept: '',
  plan_count: '',
  actual_count: '',
  hours: '',
  instructor: '',
  instructor_source: '',
  method: 'offline',
  material: '',
  exam_method: 'written',
  pass_rate: '',
  effect_score: '',
  feedback: '',
  improvement: '',
  remark: '',
}

export default function TrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [stats, setStats] = useState<TrainingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTraining, setEditingTraining] = useState<Training | null>(null)
  const [formData, setFormData] = useState<TrainingFormData>(initialFormData)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [activeTab, setActiveTab] = useState('list')
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  // 模板表头定义
  const templateHeaders = [
    '培训日期',
    '培训主题',
    '培训类别',
    '培训级别',
    '培训对象',
    '计划人数',
    '实际参加人数',
    '培训时长(小时)',
    '培训讲师',
    '讲师来源',
    '培训方式',
    '考核方式',
    '考核通过率(%)',
    '培训效果评分(1-5)',
  ]

  useEffect(() => {
    fetchTrainings()
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterCategory, filterLevel, filterStartDate, filterEndDate, currentYear])

  const fetchTrainings = async () => {
    try {
      setLoading(true)
      let url = `/api/training?page=${page}&pageSize=10`
      if (filterCategory && filterCategory !== 'all') url += `&category=${filterCategory}`
      if (filterLevel && filterLevel !== 'all') url += `&level=${filterLevel}`
      if (filterStartDate) url += `&start_date=${filterStartDate}`
      if (filterEndDate) url += `&end_date=${filterEndDate}`
      
      const res = await fetch(url)
      const data = await res.json()
      if (data.code === 0) {
        setTrainings(data.data.list)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch trainings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/training/stats?year=${currentYear}`)
      const data = await res.json()
      if (data.code === 0) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = editingTraining ? `/api/training/${editingTraining.id}` : '/api/training'
    const method = editingTraining ? 'PUT' : 'POST'
    
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
        setEditingTraining(null)
        fetchTrainings()
        fetchStats()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Failed to save training:', error)
      alert('保存失败')
    }
  }

  const handleEdit = (training: Training) => {
    setEditingTraining(training)
    setFormData({
      training_date: training.training_date.split('T')[0],
      topic: training.topic,
      category: training.category || '',
      level: training.level || '',
      target_dept: training.target_dept || '',
      plan_count: training.plan_count?.toString() || '',
      actual_count: training.actual_count?.toString() || '',
      hours: training.hours?.toString() || '',
      instructor: training.instructor || '',
      instructor_source: training.instructor_source || '',
      method: training.method || 'offline',
      material: training.material || '',
      exam_method: training.exam_method || 'written',
      pass_rate: training.pass_rate?.toString() || '',
      effect_score: training.effect_score?.toString() || '',
      feedback: training.feedback || '',
      improvement: training.improvement || '',
      remark: training.remark || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该培训记录吗？')) return
    
    try {
      const res = await fetch(`/api/training/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.code === 0) {
        fetchTrainings()
        fetchStats()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Failed to delete training:', error)
      alert('删除失败')
    }
  }

  const handleResetFilters = () => {
    setFilterCategory('')
    setFilterLevel('')
    setFilterStartDate('')
    setFilterEndDate('')
    setPage(1)
  }

  const getCategoryBadge = (category: string | null) => {
    const label = category ? trainingCategoryLabels[category] || category : '未分类'
    const colorClass = category ? 
      (trainingCategoryLabels[category] ? 
        (category === 'safety' ? 'bg-red-100 text-red-800' :
         category === 'quality' ? 'bg-blue-100 text-blue-800' :
         category === 'skill' ? 'bg-green-100 text-green-800' :
         category === 'management' ? 'bg-purple-100 text-purple-800' :
         category === 'compliance' ? 'bg-yellow-100 text-yellow-800' :
         category === 'emergency' ? 'bg-orange-100 text-orange-800' :
         'bg-gray-100 text-gray-800') :
        'bg-gray-100 text-gray-800') :
      'bg-gray-100 text-gray-800'
    return <Badge className={colorClass}>{label}</Badge>
  }

  const getMethodLabel = (method: string | null) => {
    return method ? trainingMethodLabels[method] || method : '-'
  }

  const getLevelLabel = (level: string | null) => {
    return level ? trainingLevelLabels[level] || level : '-'
  }

  const getExamMethodLabel = (method: string | null) => {
    return method ? examMethodLabels[method] || method : '-'
  }

  if (loading && trainings.length === 0) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">年度培训次数</p>
                  <p className="text-2xl font-bold">{stats.summary.total_trainings}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">总培训人次</p>
                  <p className="text-2xl font-bold text-green-600">{stats.summary.total_person_times}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">平均通过率</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.summary.avg_pass_rate.toFixed(1)}%</p>
                </div>
                <Award className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">平均培训效果</p>
                  <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold text-yellow-600">{stats.summary.avg_effect_score.toFixed(1)}</p>
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主内容区 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>培训管理</CardTitle>
              <CardDescription>培训计划、实施记录和效果评估</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                导入Excel
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingTraining(null)
                    setFormData(initialFormData)
                  }}>
                    新增培训
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTraining ? '编辑培训记录' : '新增培训记录'}
                  </DialogTitle>
                </DialogHeader>
                
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="basic">基本信息</TabsTrigger>
                    <TabsTrigger value="detail">培训详情</TabsTrigger>
                    <TabsTrigger value="evaluation">效果评估</TabsTrigger>
                  </TabsList>
                  
                  <form onSubmit={handleSubmit}>
                    <TabsContent value="basic" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="training_date">培训日期 *</Label>
                          <Input
                            id="training_date"
                            type="date"
                            value={formData.training_date}
                            onChange={(e) => setFormData({ ...formData, training_date: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="topic">培训主题 *</Label>
                          <Input
                            id="topic"
                            value={formData.topic}
                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                            placeholder="输入培训主题"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">培训类别</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择类别" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="safety">安全培训</SelectItem>
                              <SelectItem value="quality">质量培训</SelectItem>
                              <SelectItem value="skill">技能培训</SelectItem>
                              <SelectItem value="management">管理培训</SelectItem>
                              <SelectItem value="compliance">合规培训</SelectItem>
                              <SelectItem value="emergency">应急培训</SelectItem>
                              <SelectItem value="other">其他培训</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="level">培训级别</Label>
                          <Select
                            value={formData.level}
                            onValueChange={(value) => setFormData({ ...formData, level: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择级别" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="company">公司级</SelectItem>
                              <SelectItem value="dept">部门级</SelectItem>
                              <SelectItem value="team">班组级</SelectItem>
                              <SelectItem value="external">外部培训</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="target_dept">目标部门/对象</Label>
                        <Input
                          id="target_dept"
                          value={formData.target_dept}
                          onChange={(e) => setFormData({ ...formData, target_dept: e.target.value })}
                          placeholder="如：生产部、质量部、全体员工等"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="detail" className="space-y-4 mt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="plan_count">计划人数</Label>
                          <Input
                            id="plan_count"
                            type="number"
                            min="0"
                            value={formData.plan_count}
                            onChange={(e) => setFormData({ ...formData, plan_count: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="actual_count">实际人数</Label>
                          <Input
                            id="actual_count"
                            type="number"
                            min="0"
                            value={formData.actual_count}
                            onChange={(e) => setFormData({ ...formData, actual_count: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hours">培训时长（小时）</Label>
                          <Input
                            id="hours"
                            type="number"
                            min="0"
                            step="0.5"
                            value={formData.hours}
                            onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="instructor">讲师姓名</Label>
                          <Input
                            id="instructor"
                            value={formData.instructor}
                            onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                            placeholder="输入讲师姓名"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="instructor_source">讲师来源</Label>
                          <Select
                            value={formData.instructor_source}
                            onValueChange={(value) => setFormData({ ...formData, instructor_source: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择来源" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="internal">内部讲师</SelectItem>
                              <SelectItem value="external">外部讲师</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="method">培训方式</Label>
                        <Select
                          value={formData.method}
                          onValueChange={(value) => setFormData({ ...formData, method: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="online">线上培训</SelectItem>
                            <SelectItem value="offline">线下培训</SelectItem>
                            <SelectItem value="hybrid">混合培训</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="material">培训材料</Label>
                        <Textarea
                          id="material"
                          value={formData.material}
                          onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                          placeholder="培训使用的教材、课件等"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="evaluation" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="exam_method">考核方式</Label>
                          <Select
                            value={formData.exam_method}
                            onValueChange={(value) => setFormData({ ...formData, exam_method: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="written">笔试</SelectItem>
                              <SelectItem value="practical">实操考核</SelectItem>
                              <SelectItem value="oral">口试</SelectItem>
                              <SelectItem value="none">不考核</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pass_rate">通过率 (%)</Label>
                          <Input
                            id="pass_rate"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.pass_rate}
                            onChange={(e) => setFormData({ ...formData, pass_rate: e.target.value })}
                            placeholder="0-100"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="effect_score">培训效果评分 (1-5分)</Label>
                        <Select
                          value={formData.effect_score}
                          onValueChange={(value) => setFormData({ ...formData, effect_score: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择评分" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5分 - 优秀</SelectItem>
                            <SelectItem value="4">4分 - 良好</SelectItem>
                            <SelectItem value="3">3分 - 一般</SelectItem>
                            <SelectItem value="2">2分 - 较差</SelectItem>
                            <SelectItem value="1">1分 - 很差</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="feedback">培训反馈</Label>
                        <Textarea
                          id="feedback"
                          value={formData.feedback}
                          onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                          placeholder="参训人员的反馈意见和建议"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="improvement">改进措施</Label>
                        <Textarea
                          id="improvement"
                          value={formData.improvement}
                          onChange={(e) => setFormData({ ...formData, improvement: e.target.value })}
                          placeholder="针对培训效果提出的改进措施"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="remark">备注</Label>
                        <Textarea
                          id="remark"
                          value={formData.remark}
                          onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                          placeholder="其他需要记录的信息"
                        />
                      </div>
                    </TabsContent>
                    
                    <DialogFooter className="mt-6">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        取消
                      </Button>
                      <Button type="submit">
                        {editingTraining ? '保存修改' : '创建培训'}
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="list">培训列表</TabsTrigger>
              <TabsTrigger value="stats">季度统计</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-4">
              {/* 筛选器 */}
              <div className="flex flex-wrap gap-4">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="培训类别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类别</SelectItem>
                    <SelectItem value="safety">安全培训</SelectItem>
                    <SelectItem value="quality">质量培训</SelectItem>
                    <SelectItem value="skill">技能培训</SelectItem>
                    <SelectItem value="management">管理培训</SelectItem>
                    <SelectItem value="compliance">合规培训</SelectItem>
                    <SelectItem value="emergency">应急培训</SelectItem>
                    <SelectItem value="other">其他培训</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="培训级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部级别</SelectItem>
                    <SelectItem value="company">公司级</SelectItem>
                    <SelectItem value="dept">部门级</SelectItem>
                    <SelectItem value="team">班组级</SelectItem>
                    <SelectItem value="external">外部培训</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    className="w-40"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    placeholder="开始日期"
                  />
                  <span>至</span>
                  <Input
                    type="date"
                    className="w-40"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    placeholder="结束日期"
                  />
                </div>
                
                <Button variant="outline" onClick={handleResetFilters}>
                  重置筛选
                </Button>
              </div>
              
              {/* 培训列表 */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>编号</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>主题</TableHead>
                    <TableHead>类别</TableHead>
                    <TableHead>级别</TableHead>
                    <TableHead>目标部门</TableHead>
                    <TableHead>人数</TableHead>
                    <TableHead>时长</TableHead>
                    <TableHead>讲师</TableHead>
                    <TableHead>方式</TableHead>
                    <TableHead>通过率</TableHead>
                    <TableHead>效果</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainings.map((training) => (
                    <TableRow key={training.id}>
                      <TableCell className="font-medium">{training.training_no}</TableCell>
                      <TableCell>{formatDate(training.training_date)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{training.topic}</p>
                          {training.remark && (
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{training.remark}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(training.category)}</TableCell>
                      <TableCell>{getLevelLabel(training.level)}</TableCell>
                      <TableCell>{training.target_dept || '-'}</TableCell>
                      <TableCell>
                        {training.actual_count || 0}
                        {training.plan_count ? ` / ${training.plan_count}` : ''}
                      </TableCell>
                      <TableCell>{training.hours ? `${training.hours}h` : '-'}</TableCell>
                      <TableCell>
                        <div>
                          <p>{training.instructor || '-'}</p>
                          {training.instructor_source && (
                            <p className="text-xs text-gray-500">
                              {instructorSourceLabels[training.instructor_source] || training.instructor_source}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getMethodLabel(training.method)}</TableCell>
                      <TableCell>
                        {training.pass_rate !== null ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPassRateColor(training.pass_rate)}`}>
                            {training.pass_rate}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {training.effect_score !== null ? (
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getEffectScoreColor(training.effect_score)}`}>
                              {training.effect_score}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(training)}>
                            编辑
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(training.id)}>
                            删除
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
            </TabsContent>
            
            <TabsContent value="stats" className="space-y-4">
              {/* 年度选择 */}
              <div className="flex items-center gap-4">
                <Label>统计年度：</Label>
                <Select 
                  value={currentYear.toString()} 
                  onValueChange={(value) => setCurrentYear(parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}年</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 季度统计表格 */}
              {stats && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>季度</TableHead>
                      <TableHead>培训次数</TableHead>
                      <TableHead>培训人次</TableHead>
                      <TableHead>培训时长(小时)</TableHead>
                      <TableHead>平均通过率</TableHead>
                      <TableHead>平均效果评分</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.quarter_stats.map((q) => (
                      <TableRow key={q.quarter}>
                        <TableCell className="font-medium">{q.quarter}</TableCell>
                        <TableCell>{q.count}</TableCell>
                        <TableCell>{q.person_times}</TableCell>
                        <TableCell>{q.hours.toFixed(1)}</TableCell>
                        <TableCell>
                          {q.avg_pass_rate !== null ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPassRateColor(q.avg_pass_rate)}`}>
                              {q.avg_pass_rate.toFixed(1)}%
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {q.avg_effect_score !== null ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getEffectScoreColor(q.avg_effect_score)}`}>
                              {q.avg_effect_score.toFixed(1)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* 年度合计行 */}
                    <TableRow className="bg-gray-50 font-medium">
                      <TableCell>年度合计</TableCell>
                      <TableCell>{stats.summary.total_trainings}</TableCell>
                      <TableCell>{stats.summary.total_person_times}</TableCell>
                      <TableCell>{stats.summary.total_hours.toFixed(1)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPassRateColor(stats.summary.avg_pass_rate)}`}>
                          {stats.summary.avg_pass_rate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getEffectScoreColor(stats.summary.avg_effect_score)}`}>
                          {stats.summary.avg_effect_score.toFixed(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
              
              {/* 按类别统计 */}
              {stats && Object.keys(stats.category_stats).length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">按类别统计</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>培训类别</TableHead>
                        <TableHead>培训次数</TableHead>
                        <TableHead>培训人次</TableHead>
                        <TableHead>培训时长(小时)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(stats.category_stats).map(([category, data]) => (
                        <TableRow key={category}>
                          <TableCell>{getCategoryBadge(category)}</TableCell>
                          <TableCell>{data.count}</TableCell>
                          <TableCell>{data.person_times}</TableCell>
                          <TableCell>{data.hours.toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* 按培训方式统计 */}
              {stats && Object.keys(stats.method_stats).length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">按培训方式统计</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(stats.method_stats).map(([method, data]) => (
                      <Card key={method}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-blue-500" />
                            <div>
                              <p className="text-sm text-gray-500">{getMethodLabel(method)}</p>
                              <p className="text-xl font-bold">{data.count} 次 / {data.person_times} 人次</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Excel导入对话框 */}
      <ExcelImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="培训记录导入"
        templateHeaders={templateHeaders}
        templateFileName="培训记录导入模板"
        onImport={async (data) => {
          const res = await fetch('/api/training/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data }),
          })
          const result = await res.json()
          if (result.code !== 0) {
            throw new Error(result.message)
          }
          return result.data
        }}
        onSuccess={() => {
          fetchTrainings()
          fetchStats()
          setImportDialogOpen(false)
        }}
      />
    </div>
  )
}
