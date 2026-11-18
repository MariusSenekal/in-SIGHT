// Turns the uploaded file (sent as either raw CSV text or base64-encoded
// .xlsx bytes) into the same string[][] grid shape, so preview/upload don't
// need to care which format the admin's file was in.
import { parseCsv } from './csv'
import { parseXlsxToGrid } from './xlsx'

export interface BulkImportFilePayload {
  format: 'csv' | 'xlsx'
  /** Raw CSV text when format is 'csv', base64-encoded bytes when 'xlsx'. */
  content: string
}

export const parseBulkImportFile = async (payload: BulkImportFilePayload): Promise<string[][]> => {
  if (payload.format === 'xlsx') {
    const buffer = Buffer.from(payload.content, 'base64')
    return parseXlsxToGrid(buffer)
  }
  return parseCsv(payload.content ?? '')
}
