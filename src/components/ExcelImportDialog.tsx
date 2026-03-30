'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  templateHeaders: string[]
  templateFileName: string
  onImport: (data: any[]) => Promise<{ success: number; error: number; errors: string[] }>
  onSuccess?: () => void
}

export function ExcelImportDialog({
  open,
  onOpenChange,
  title,
  templateHeaders,
  templateFileName,
  onImport,
  onSuccess,
}: ExcelImportDialogProps) {
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; error: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([templateHeaders])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '模板')
    XLSX.writeFile(wb, `${templateFileName}_模板.xlsx`)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        // 跳过表头，转换数据
        const rows = jsonData.slice(1).filter((row: any) => row.length > 0)
        const formattedData = rows.map((row: any) => {
          const obj: any = {}
          templateHeaders.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        })
        
        setPreviewData(formattedData.slice(0, 10)) // 只预览前10条
        setImportResult(null)
      } catch (error) {
        alert('解析Excel失败，请检查文件格式')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImport = async () => {
    if (previewData.length === 0) {
      alert('请先选择Excel文件')
      return
    }

    setImporting(true)
    try {
      const result = await onImport(previewData)
      setImportResult(result)
      if (result.error === 0 && onSuccess) {
        onSuccess()
      }
    } catch (error) {
      alert('导入失败')
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setPreviewData([])
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) reset() }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            {title} - Excel导入
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              下载模板
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              选择Excel文件
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* 导入说明 */}
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
            <p className="font-medium">导入说明：</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>请先下载模板，按照模板格式填写数据</li>
              <li>支持 .xlsx 和 .xls 格式</li>
              <li>第一行为表头，不要修改表头名称</li>
              <li>一次最多导入1000条数据</li>
            </ul>
          </div>

          {/* 数据预览 */}
          {previewData.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">数据预览（前10条）</h4>
              <div className="border rounded overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {templateHeaders.map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index}>
                        {templateHeaders.map((header) => (
                          <TableCell key={header}>{row[header]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                共 {previewData.length} 条数据（预览前10条）
              </p>
            </div>
          )}

          {/* 导入结果 */}
          {importResult && (
            <div className={`p-4 rounded ${importResult.error === 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                {importResult.error === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <span className="font-medium">
                  导入完成：成功 {importResult.success} 条，失败 {importResult.error} 条
                </span>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-2 text-sm text-red-600 max-h-32 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
            {previewData.length > 0 && !importResult && (
              <Button onClick={handleImport} disabled={importing}>
                {importing ? '导入中...' : '确认导入'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
