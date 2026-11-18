// Styled .xlsx template generation + parsing for bulk import. Templates are
// a single sheet: a styled header row, a frozen pane under it, sized
// columns, and a sample row (greyed out, row 2) showing the expected format
// - deleted by the admin before they add real data, same mental model as the
// CSV template but friendlier to fill in directly in Excel/Sheets.
import ExcelJS from 'exceljs'
import type { BulkFieldSpec } from './bulkImportSchemas'

const HEADER_FILL = 'FF1E3A5F'
const SAMPLE_FILL = 'FFF3F4F6'

export const buildXlsxTemplate = async (fields: BulkFieldSpec[], sheetName: string): Promise<ExcelJS.Buffer> => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'in-SIGHT'
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31), {
    views: [{ state: 'frozen', ySplit: 1 }]
  })

  sheet.columns = fields.map((f) => ({
    header: f.header,
    key: f.key,
    width: Math.max(f.header.length + 4, 18)
  }))

  const headerRow = sheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } }
  })
  headerRow.height = 22

  // Sample row - greyed out styling signals "example, replace me" without a
  // separate instructions row that would throw off the header-match check.
  const sampleRow = sheet.addRow(fields.map((f) => f.example))
  sampleRow.eachCell((cell) => {
    cell.font = { italic: true, color: { argb: 'FF9CA3AF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SAMPLE_FILL } }
  })

  fields.forEach((f, i) => {
    const col = sheet.getColumn(i + 1)
    if (f.type === 'date') {
      col.numFmt = 'yyyy-mm-dd'
    }
    if (f.type === 'boolean') {
      sheet.getCell(2, i + 1).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"TRUE,FALSE"']
      }
      for (let row = 3; row <= 500; row++) {
        sheet.getCell(row, i + 1).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"TRUE,FALSE"']
        }
      }
    }
  })

  return workbook.xlsx.writeBuffer()
}

/**
 * Parses the first worksheet of an .xlsx file into the same string[][] grid
 * shape parseCsv() produces (header row included, sample/data rows after),
 * so the rest of the bulk-import pipeline (validateImport) is format-agnostic.
 */
export const parseXlsxToGrid = async (buffer: ArrayBuffer | Buffer): Promise<string[][]> => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as Buffer)
  const sheet = workbook.worksheets[0]
  if (!sheet) return []

  const grid: string[][] = []
  sheet.eachRow((row) => {
    const values: string[] = []
    const colCount = Math.max(row.cellCount, sheet.columnCount)
    for (let i = 1; i <= colCount; i++) {
      const cell = row.getCell(i)
      values.push(cellToString(cell))
    }
    // Skip fully-empty rows (e.g. trailing blank rows Excel sometimes keeps).
    if (values.some((v) => v.trim() !== '')) grid.push(values)
  })

  return grid
}

const cellToString = (cell: ExcelJS.Cell): string => {
  const value = cell.value
  if (value === null || value === undefined) return ''
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  if (typeof value === 'object' && 'result' in (value as any)) {
    return String((value as any).result ?? '')
  }
  if (typeof value === 'object' && 'text' in (value as any)) {
    return String((value as any).text ?? '')
  }
  return String(value)
}
