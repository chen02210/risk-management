'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { userRoleLabels, formatDate } from '@/lib/utils'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Download, FileSpreadsheet } from 'lucide-react'

// 用户角色选项
const roleOptions = [
  { value: 'company_admin', label: '公司管理员' },
  { value: 'dept_admin', label: '部门管理员' },
  { value: 'user', label: '普通用户' },
  { value: 'readonly', label: '只读用户' },
]

// 用户状态选项
const statusOptions = [
  { value: 'active', label: '正常' },
  { value: 'inactive', label: '禁用' },
  { value: 'locked', label: '锁定' },
]

interface Department {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  parent: { id: string; name: string } | null
  _count: { users: number; children: number }
  created_at: string
}

interface User {
  id: string
  email: string
  name: string
  phone: string | null
  role: string
  status: string
  dept_id: string | null
  department: { id: string; name: string } | null
  last_login: string | null
  created_at: string
}

interface UserListResponse {
  list: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function SettingsPage() {
  // 部门管理状态
  const [departments, setDepartments] = useState<Department[]>([])
  const [deptLoading, setDeptLoading] = useState(true)
  const [deptSearch, setDeptSearch] = useState('')
  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [deptForm, setDeptForm] = useState({ name: '', description: '', parent_id: '' })

  // 用户管理状态
  const [users, setUsers] = useState<User[]>([])
  const [userLoading, setUserLoading] = useState(true)
  const [userResponse, setUserResponse] = useState<UserListResponse | null>(null)
  const [userPage, setUserPage] = useState(1)
  const [userSearch, setUserSearch] = useState('')
  const [userDeptFilter, setUserDeptFilter] = useState('all')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState({
    email: '',
    name: '',
    phone: '',
    role: 'user',
    dept_id: '',
    status: 'active',
    password: '',
  })

  // 获取部门列表
  const fetchDepartments = async () => {
    try {
      setDeptLoading(true)
      const res = await fetch(`/api/settings/departments?search=${deptSearch}`)
      const data = await res.json()
      if (data.code === 0) {
        setDepartments(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    } finally {
      setDeptLoading(false)
    }
  }

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setUserLoading(true)
      let url = `/api/settings/users?page=${userPage}&pageSize=10`
      if (userSearch) url += `&search=${userSearch}`
      if (userDeptFilter) url += `&deptId=${userDeptFilter}`
      if (userRoleFilter) url += `&role=${userRoleFilter}`
      
      const res = await fetch(url)
      const data = await res.json()
      if (data.code === 0) {
        setUsers(data.data.list)
        setUserResponse(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setUserLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [deptSearch])

  useEffect(() => {
    fetchUsers()
  }, [userPage, userSearch, userDeptFilter, userRoleFilter])

  // 创建/更新部门
  const handleSaveDept = async () => {
    try {
      const url = editingDept 
        ? `/api/settings/departments/${editingDept.id}` 
        : '/api/settings/departments'
      const method = editingDept ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deptForm.name,
          description: deptForm.description,
          parent_id: deptForm.parent_id || null,
        }),
      })
      
      const data = await res.json()
      if (data.code === 0) {
        setIsDeptDialogOpen(false)
        setDeptForm({ name: '', description: '', parent_id: '' })
        setEditingDept(null)
        fetchDepartments()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Save department error:', error)
    }
  }

  // 删除部门
  const handleDeleteDept = async (id: string) => {
    if (!confirm('确定要删除该部门吗？')) return
    
    try {
      const res = await fetch(`/api/settings/departments/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.code === 0) {
        fetchDepartments()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Delete department error:', error)
    }
  }

  // 编辑部门
  const handleEditDept = (dept: Department) => {
    setEditingDept(dept)
    setDeptForm({
      name: dept.name,
      description: dept.description || '',
      parent_id: dept.parent_id || '',
    })
    setIsDeptDialogOpen(true)
  }

  // 创建/更新用户
  const handleSaveUser = async () => {
    try {
      const url = editingUser 
        ? `/api/settings/users/${editingUser.id}` 
        : '/api/settings/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const body: any = {
        name: userForm.name,
        phone: userForm.phone,
        role: userForm.role,
        dept_id: userForm.dept_id || null,
      }
      
      if (!editingUser) {
        body.email = userForm.email
        body.status = userForm.status
      } else {
        body.status = userForm.status
        if (userForm.password) body.password = userForm.password
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      const data = await res.json()
      if (data.code === 0) {
        setIsUserDialogOpen(false)
        setUserForm({
          email: '',
          name: '',
          phone: '',
          role: 'user',
          dept_id: '',
          status: 'active',
          password: '',
        })
        setEditingUser(null)
        fetchUsers()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Save user error:', error)
    }
  }

  // 删除用户
  const handleDeleteUser = async (id: string) => {
    if (!confirm('确定要删除该用户吗？')) return
    
    try {
      const res = await fetch(`/api/settings/users/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.code === 0) {
        fetchUsers()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Delete user error:', error)
    }
  }

  // 编辑用户
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserForm({
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      role: user.role,
      dept_id: user.dept_id || '',
      status: user.status,
      password: '',
    })
    setIsUserDialogOpen(true)
  }

  // 打开新增部门对话框
  const openAddDeptDialog = () => {
    setEditingDept(null)
    setDeptForm({ name: '', description: '', parent_id: '' })
    setIsDeptDialogOpen(true)
  }

  // 打开新增用户对话框
  const openAddUserDialog = () => {
    setEditingUser(null)
    setUserForm({
      email: '',
      name: '',
      phone: '',
      role: 'user',
      dept_id: '',
      status: 'active',
      password: '',
    })
    setIsUserDialogOpen(true)
  }

  // ==================== 导入功能状态 ====================
  const [isDeptImportOpen, setIsDeptImportOpen] = useState(false)
  const [isUserImportOpen, setIsUserImportOpen] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<{success: number, error: number, errors: string[]} | null>(null)
  const deptFileInputRef = useRef<HTMLInputElement>(null)
  const userFileInputRef = useRef<HTMLInputElement>(null)

  // 解析Excel文件
  const parseExcelFile = async (file: File): Promise<any[]> => {
    const XLSX = await import('xlsx')
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(firstSheet)
    return data
  }

  // 下载部门导入模板
  const downloadDeptTemplate = async () => {
    const XLSX = await import('xlsx')
    const headers = ['部门名称', '上级部门', '部门描述']
    const exampleData = [
      { '部门名称': '技术部', '上级部门': '', '部门描述': '负责产品研发' },
      { '部门名称': '前端组', '上级部门': '技术部', '部门描述': '负责前端开发' },
    ]
    const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '部门导入模板')
    XLSX.writeFile(workbook, '部门导入模板.xlsx')
  }

  // 下载用户导入模板
  const downloadUserTemplate = async () => {
    const XLSX = await import('xlsx')
    const headers = ['姓名', '邮箱', '手机号', '角色', '部门']
    const exampleData = [
      { '姓名': '张三', '邮箱': 'zhangsan@example.com', '手机号': '13800138000', '角色': '普通用户', '部门': '技术部' },
      { '姓名': '李四', '邮箱': 'lisi@example.com', '手机号': '13900139000', '角色': '部门管理员', '部门': '技术部' },
    ]
    const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '用户导入模板')
    XLSX.writeFile(workbook, '用户导入模板.xlsx')
  }

  // 处理部门文件选择
  const handleDeptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      setImportLoading(true)
      const data = await parseExcelFile(file)
      setImportData(data)
      setImportResult(null)
    } catch (error) {
      alert('文件解析失败，请检查文件格式')
    } finally {
      setImportLoading(false)
    }
  }

  // 处理用户文件选择
  const handleUserFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      setImportLoading(true)
      const data = await parseExcelFile(file)
      setImportData(data)
      setImportResult(null)
    } catch (error) {
      alert('文件解析失败，请检查文件格式')
    } finally {
      setImportLoading(false)
    }
  }

  // 提交部门导入
  const handleDeptImport = async () => {
    if (importData.length === 0) {
      alert('请先选择文件')
      return
    }

    try {
      setImportLoading(true)
      const res = await fetch('/api/settings/departments/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: importData }),
      })

      const result = await res.json()
      if (result.code === 0) {
        setImportResult(result.data)
        fetchDepartments()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('导入失败')
    } finally {
      setImportLoading(false)
    }
  }

  // 提交用户导入
  const handleUserImport = async () => {
    if (importData.length === 0) {
      alert('请先选择文件')
      return
    }

    try {
      setImportLoading(true)
      const res = await fetch('/api/settings/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: importData }),
      })

      const result = await res.json()
      if (result.code === 0) {
        setImportResult(result.data)
        fetchUsers()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('导入失败')
    } finally {
      setImportLoading(false)
    }
  }

  // 关闭导入对话框
  const closeDeptImport = () => {
    setIsDeptImportOpen(false)
    setImportData([])
    setImportResult(null)
    if (deptFileInputRef.current) deptFileInputRef.current.value = ''
  }

  const closeUserImport = () => {
    setIsUserImportOpen(false)
    setImportData([])
    setImportResult(null)
    if (userFileInputRef.current) userFileInputRef.current.value = ''
  }

  // 获取角色标签样式
  const getRoleBadgeStyle = (role: string) => {
    const styles: Record<string, string> = {
      company_admin: 'bg-purple-100 text-purple-800',
      dept_admin: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
      readonly: 'bg-gray-100 text-gray-800',
      super_admin: 'bg-red-100 text-red-800',
    }
    return styles[role] || 'bg-gray-100 text-gray-800'
  }

  // 获取状态标签样式
  const getStatusBadgeStyle = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      locked: 'bg-red-100 text-red-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">系统设置</h2>
        <p className="text-gray-500">管理部门和用户账号</p>
      </div>

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">部门管理</TabsTrigger>
          <TabsTrigger value="users">用户管理</TabsTrigger>
        </TabsList>

        {/* 部门管理标签页 */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>部门列表</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="搜索部门..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  className="w-64"
                />
                <Button variant="outline" onClick={() => setIsDeptImportOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  导入部门
                </Button>
                <Button onClick={openAddDeptDialog}>新增部门</Button>
              </div>
            </CardHeader>
            <CardContent>
              {deptLoading ? (
                <div className="text-center py-8">加载中...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>部门名称</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>上级部门</TableHead>
                      <TableHead>用户数量</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          暂无部门数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      departments.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell>{dept.description || '-'}</TableCell>
                          <TableCell>{dept.parent?.name || '-'}</TableCell>
                          <TableCell>{dept._count.users}</TableCell>
                          <TableCell>{formatDate(dept.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditDept(dept)}
                              >
                                编辑
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteDept(dept.id)}
                              >
                                删除
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 用户管理标签页 */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>用户列表</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="搜索姓名/邮箱/电话..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-48"
                />
                <Select value={userDeptFilter} onValueChange={setUserDeptFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="选择部门" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部部门</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部角色</SelectItem>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setIsUserImportOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  导入用户
                </Button>
                <Button onClick={openAddUserDialog}>新增用户</Button>
              </div>
            </CardHeader>
            <CardContent>
              {userLoading ? (
                <div className="text-center py-8">加载中...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>姓名</TableHead>
                        <TableHead>邮箱</TableHead>
                        <TableHead>电话</TableHead>
                        <TableHead>部门</TableHead>
                        <TableHead>角色</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>最后登录</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                            暂无用户数据
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.phone || '-'}</TableCell>
                            <TableCell>{user.department?.name || '-'}</TableCell>
                            <TableCell>
                              <Badge className={getRoleBadgeStyle(user.role)}>
                                {userRoleLabels[user.role] || user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeStyle(user.status)}>
                                {statusOptions.find(s => s.value === user.status)?.label || user.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(user.last_login)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                >
                                  编辑
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  删除
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* 分页 */}
                  {userResponse && userResponse.totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-gray-500">
                        第 {userResponse.page} 页，共 {userResponse.totalPages} 页，共 {userResponse.total} 条记录
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(p => Math.max(1, p - 1))}
                          disabled={userPage === 1}
                        >
                          上一页
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(p => Math.min(userResponse.totalPages, p + 1))}
                          disabled={userPage === userResponse.totalPages}
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 部门编辑对话框 */}
      <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingDept ? '编辑部门' : '新增部门'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">部门名称 *</Label>
              <Input
                id="dept-name"
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="请输入部门名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-desc">部门描述</Label>
              <Input
                id="dept-desc"
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                placeholder="请输入部门描述"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-parent">上级部门</Label>
              <Select 
                value={deptForm.parent_id} 
                onValueChange={(value) => setDeptForm({ ...deptForm, parent_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择上级部门（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  {departments
                    .filter(d => d.id !== editingDept?.id)
                    .map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeptDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveDept}>
              {editingDept ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 用户编辑对话框 */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? '编辑用户' : '新增用户'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">姓名 *</Label>
              <Input
                id="user-name"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="请输入用户姓名"
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="user-email">邮箱 *</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="请输入邮箱地址"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="user-phone">电话</Label>
              <Input
                id="user-phone"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                placeholder="请输入电话号码"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">角色</Label>
              <Select 
                value={userForm.role} 
                onValueChange={(value) => setUserForm({ ...userForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-dept">所属部门</Label>
              <Select 
                value={userForm.dept_id} 
                onValueChange={(value) => setUserForm({ ...userForm, dept_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">未分配</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-status">状态</Label>
              <Select 
                value={userForm.status} 
                onValueChange={(value) => setUserForm({ ...userForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingUser && (
              <div className="space-y-2">
                <Label htmlFor="user-password">新密码（留空则不修改）</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="请输入新密码"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveUser}>
              {editingUser ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 部门导入对话框 */}
      <Dialog open={isDeptImportOpen} onOpenChange={closeDeptImport}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>导入部门</DialogTitle>
            <DialogDescription>
              请上传Excel文件，支持 .xlsx 格式
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadDeptTemplate} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                下载导入模板
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-import-file">选择Excel文件</Label>
              <Input
                id="dept-import-file"
                ref={deptFileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleDeptFileChange}
              />
            </div>
            {importData.length > 0 && (
              <div className="text-sm text-gray-600">
                已读取 <strong>{importData.length}</strong> 条数据
              </div>
            )}
            {importResult && (
              <div className="space-y-2">
                <div className="text-sm font-medium">导入结果：</div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">成功: {importResult.success}</span>
                  <span className="text-red-600">失败: {importResult.error}</span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded text-sm">
                    {importResult.errors.map((error, idx) => (
                      <div key={idx} className="text-red-600 mb-1">{error}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
              <div className="font-medium mb-1">导入说明：</div>
              <ul className="list-disc list-inside space-y-1">
                <li>表头必须包含：部门名称、上级部门、部门描述</li>
                <li>部门名称为必填项，且不能重复</li>
                <li>上级部门需填写已存在的部门名称，如不填写则为顶级部门</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeptImport}>
              关闭
            </Button>
            <Button onClick={handleDeptImport} disabled={importLoading || importData.length === 0}>
              {importLoading ? '导入中...' : '开始导入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 用户导入对话框 */}
      <Dialog open={isUserImportOpen} onOpenChange={closeUserImport}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>导入用户</DialogTitle>
            <DialogDescription>
              请上传Excel文件，支持 .xlsx 格式
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadUserTemplate} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                下载导入模板
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-import-file">选择Excel文件</Label>
              <Input
                id="user-import-file"
                ref={userFileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleUserFileChange}
              />
            </div>
            {importData.length > 0 && (
              <div className="text-sm text-gray-600">
                已读取 <strong>{importData.length}</strong> 条数据
              </div>
            )}
            {importResult && (
              <div className="space-y-2">
                <div className="text-sm font-medium">导入结果：</div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">成功: {importResult.success}</span>
                  <span className="text-red-600">失败: {importResult.error}</span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded text-sm">
                    {importResult.errors.map((error, idx) => (
                      <div key={idx} className="text-red-600 mb-1">{error}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
              <div className="font-medium mb-1">导入说明：</div>
              <ul className="list-disc list-inside space-y-1">
                <li>表头必须包含：姓名、邮箱、手机号、角色、部门</li>
                <li>姓名和邮箱为必填项，邮箱格式需正确</li>
                <li>邮箱不能重复，重复邮箱将被跳过</li>
                <li>角色可选值：公司管理员、部门管理员、普通用户、只读用户</li>
                <li>部门需填写已存在的部门名称，如不填写则不分配部门</li>
                <li>导入用户的默认密码为：<strong>password123</strong></li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeUserImport}>
              关闭
            </Button>
            <Button onClick={handleUserImport} disabled={importLoading || importData.length === 0}>
              {importLoading ? '导入中...' : '开始导入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
