import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// 密码验证
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// 生成 JWT Token
export function generateToken(payload: { userId: string; companyId: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// 验证 JWT Token
export function verifyToken(token: string): { userId: string; companyId: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; companyId: string; role: string }
  } catch {
    return null
  }
}

// 设置认证 Cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })
}

// 清除认证 Cookie
export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

// 获取当前用户（从请求中）
export async function getCurrentUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      company: true,
      department: true,
    },
  })

  return user
}

// 检查权限
export function checkPermission(userRole: string, requiredRole: string[]): boolean {
  return requiredRole.includes(userRole)
}

// 权限等级
const roleLevel: Record<string, number> = {
  super_admin: 100,
  company_admin: 80,
  dept_admin: 60,
  user: 40,
  readonly: 20,
}

// 检查角色等级
export function hasRoleLevel(userRole: string, minLevel: string): boolean {
  return (roleLevel[userRole] || 0) >= (roleLevel[minLevel] || 0)
}
