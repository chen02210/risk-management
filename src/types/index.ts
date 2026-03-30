import { 
  Company, User, Department, Risk, RiskMeasure, 
  KRI, KRIMonthlyData, EmergencyPlan, RiskCheck, 
  Supplier, Training, TrainingStats 
} from '@prisma/client'

// 基础响应类型
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 认证类型
export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  companyId: string
  deptId: string | null
  companyName: string
  departmentName: string | null
}

// 风险相关类型
export interface RiskWithRelations extends Risk {
  department?: Department | null
  owner?: User | null
  measures?: RiskMeasure[]
  _count?: {
    measures: number
  }
}

export interface RiskFormData {
  name: string
  category: string
  description?: string
  consequence?: string
  source?: string
  likelihood: number
  impact: number
  response_strategy?: string
  dept_id?: string
  owner_id?: string
  next_evaluate_at?: string
}

export interface RiskAssessment {
  likelihood: number
  impact: number
  risk_value: number
  risk_level: string
}

// 措施相关类型
export interface RiskMeasureWithRelations extends RiskMeasure {
  department?: Department | null
  owner?: User | null
}

export interface RiskMeasureFormData {
  description: string
  dept_id?: string
  owner_id?: string
  collaborator_dept?: string
  start_date?: string
  plan_date?: string
  budget?: number
  status?: string
}

// KRI相关类型
export interface KRIWithRelations extends KRI {
  department?: Department | null
  monthly_data?: KRIMonthlyData[]
  _count?: {
    monthly_data: number
  }
}

export interface KRIFormData {
  name: string
  linked_risk_no?: string
  description?: string
  formula?: string
  frequency?: string
  unit?: string
  target?: number
  warning_threshold?: number
  alert_threshold?: number
  dept_id?: string
}

export interface KRIMonthlyDataFormData {
  month: string
  value: number
  notes?: string
}

// 用户相关类型
export interface UserWithRelations extends User {
  company: Company
  department?: Department | null
}

export interface UserFormData {
  email: string
  name: string
  password?: string
  phone?: string
  role: string
  dept_id?: string
  status?: string
}

// 部门相关类型
export interface DepartmentWithRelations extends Department {
  parent?: Department | null
  children?: Department[]
  _count?: {
    users: number
    risks: number
  }
}

// 供应商相关类型
export interface SupplierFormData {
  name: string
  supplier_no?: string
  supply_category?: string
  supply_items?: string
  supply_share?: number
  cooperation_years?: number
  replaceability?: number
  on_time_rate?: number
  quality_rate?: number
  price_competitiveness?: number
  financial_stability?: number
  service_cooperation?: number
  has_agreement?: boolean
  agreement_expire?: string
  improvement_require?: string
}

// 培训相关类型
export interface TrainingFormData {
  training_no?: string
  training_date: string
  topic: string
  category?: string
  level?: string
  target_dept?: string
  plan_count?: number
  actual_count?: number
  hours?: number
  instructor?: string
  instructor_source?: string
  method?: string
  material?: string
  exam_method?: string
  pass_rate?: number
  effect_score?: number
  feedback?: string
  improvement?: string
  remark?: string
}

// 应急预案相关类型
export interface EmergencyPlanFormData {
  name: string
  plan_no?: string
  linked_risk_no?: string
  applicable_scenario?: string
  trigger_condition?: string
  commander?: string
  site_commander?: string
  response_time_limit?: string
  key_steps?: string
  resource_needs?: string
  drill_frequency?: string
  dept_id?: string
}

// 风险检查相关类型
export interface RiskCheckFormData {
  check_no?: string
  area?: string
  category?: string
  check_item: string
  standard?: string
  method?: string
  check_date: string
  checker?: string
  result?: string
  issue_desc?: string
  risk_level?: string
  measure?: string
  owner_id?: string
  deadline?: string
}

// 仪表盘统计类型
export interface DashboardStats {
  totalRisks: number
  risksByLevel: { level: string; count: number }[]
  risksByCategory: { category: string; count: number }[]
  pendingMeasures: number
  overdueMeasures: number
  kriAlertCount: number
  upcomingDrills: number
  recentActivities: ActivityLog[]
}

export interface ActivityLog {
  id: string
  action: string
  resource: string
  resourceName: string
  userName: string
  created_at: Date
}

// 查询参数类型
export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface RiskFilterParams extends PaginationParams {
  category?: string
  status?: string
  risk_level?: string
  dept_id?: string
  owner_id?: string
  search?: string
}

export interface MeasureFilterParams extends PaginationParams {
  status?: string
  risk_id?: string
  dept_id?: string
  owner_id?: string
}

// 供应商筛选参数
export interface SupplierFilterParams extends PaginationParams {
  risk_level?: string
  status?: string
  supply_category?: string
  search?: string
  expiring_soon?: boolean
}

// 供应商统计数据
export interface SupplierStats {
  total: number
  lowRisk: number
  mediumRisk: number
  highRisk: number
  expiringCount: number
}
