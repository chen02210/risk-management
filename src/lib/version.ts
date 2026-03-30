// 版本信息管理

export const APP_VERSION = '1.0.0'
export const APP_NAME = '风险管理系统'
export const APP_RELEASE_DATE = '2026-03-29'
export const APP_COMPANY = '包装印刷企业版'

export const getVersionInfo = () => {
  return {
    version: APP_VERSION,
    name: APP_NAME,
    releaseDate: APP_RELEASE_DATE,
    company: APP_COMPANY,
    fullVersion: `${APP_NAME} v${APP_VERSION}`,
  }
}

export const getVersionString = () => {
  return `v${APP_VERSION}`
}
