import * as XLSX from 'xlsx';

export interface ParsedProductRow {
  sku: string;
  name: string;
  category?: string;
  costUsd: number;
  priceUsd: number;
  taxRate: number;
  taxType: 'TAXABLE' | 'EXEMPT' | 'EXONERATED';
  initialStock: number;
  unitOfMeasure?: string;
  warehouseCode?: string;
}

export interface ParseResult {
  products: ParsedProductRow[];
  detectedFormat: 'HIDROZULCA_EXCEL' | 'STANDARD_COLUMNS' | 'PRICE_LIST';
  sheetName: string;
  availableSheets: string[];
  totalRows: number;
  errors: string[];
}

function cleanString(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function parseNumber(val: any, defaultVal = 0): number {
  if (val === null || val === undefined || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const cleaned = String(val).replace(/[^0-9.,-]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? defaultVal : num;
}

function generateCleanSku(category: string, name: string, existingSkus: Set<string>): string {
  const catPrefix = (category || 'GEN')
    .substring(0, 3)
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]/g, 'CAT');

  const nameSlug = (name || 'PRODUCTO')
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 24);

  const prefix = catPrefix || 'GEN';
  const slug = nameSlug || 'ITEM';
  let baseSku = prefix + '-' + slug;
  let finalSku = baseSku;
  let counter = 1;

  while (existingSkus.has(finalSku)) {
    finalSku = baseSku.substring(0, 22) + '-' + counter;
    counter++;
  }

  existingSkus.add(finalSku);
  return finalSku;
}

export function parseProductFile(dataBuffer: ArrayBuffer | Uint8Array, selectedSheet?: string, fileName?: string): ParseResult {
  let workbook: XLSX.WorkBook;
  const isCsv = fileName ? fileName.toLowerCase().endsWith('.csv') : false;

  try {
    if (isCsv) {
      // Intentar primero decodificación de texto UTF-8 para evitar caracteres alterados en acentos
      const uint8 = dataBuffer instanceof Uint8Array ? dataBuffer : new Uint8Array(dataBuffer);
      const text = new TextDecoder('utf-8').decode(uint8);
      workbook = XLSX.read(text, { type: 'string' });
    } else {
      workbook = XLSX.read(dataBuffer, { type: 'array' });
    }
  } catch {
    // Fallback estándar en array si falla decodificación directa
    workbook = XLSX.read(dataBuffer, { type: 'array' });
  }

  const availableSheets = workbook.SheetNames;
  
  let targetSheetName = selectedSheet || availableSheets[0];
  if (!selectedSheet) {
    const invSheet = availableSheets.find(s => s.toLowerCase().includes('inventario'));
    if (invSheet) targetSheetName = invSheet;
  }

  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) {
    throw new Error('La hoja ' + targetSheetName + ' no fue encontrada en el archivo.');
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
  if (rawRows.length === 0) {
    return {
      products: [],
      detectedFormat: 'STANDARD_COLUMNS',
      sheetName: targetSheetName,
      availableSheets,
      totalRows: 0,
      errors: ['El archivo o la hoja seleccionada está vacía.']
    };
  }

  let headerRowIndex = -1;
  let detectedFormat: 'HIDROZULCA_EXCEL' | 'STANDARD_COLUMNS' | 'PRICE_LIST' = 'STANDARD_COLUMNS';
  let colIndexes: { [key: string]: number } = {};

  for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
    const row = rawRows[r] || [];
    const rowStr = row.map(c => cleanString(c).toLowerCase()).join(' | ');

    if (rowStr.includes('sku') || ((rowStr.includes('codigo') || rowStr.includes('código')) && (rowStr.includes('name') || rowStr.includes('nombre') || rowStr.includes('producto') || rowStr.includes('descripc')))) {
      headerRowIndex = r;
      detectedFormat = 'STANDARD_COLUMNS';
      row.forEach((colVal, cIdx) => {
        const val = cleanString(colVal).toLowerCase();
        if (val === 'sku' || val.includes('codigo') || val.includes('código')) colIndexes.sku = cIdx;
        if (val.includes('name') || val.includes('nombre') || val.includes('producto') || val.includes('descripc')) colIndexes.name = cIdx;
        if (val.includes('categor')) colIndexes.category = cIdx;
        if (val.includes('cost')) colIndexes.costUsd = cIdx;
        if (val.includes('price') || val.includes('precio')) colIndexes.price = cIdx;
        if (val.includes('tax') || val.includes('iva')) colIndexes.taxRate = cIdx;
        if (val.includes('stock') || val.includes('cantidad') || val.includes('cant') || val.includes('existencia')) colIndexes.quantity = cIdx;
        if (val.includes('unit') || val.includes('unidad') || val.includes('medida') || val.includes('presentacion') || val.includes('presentación')) colIndexes.unit = cIdx;
        if (val.includes('warehouse') || val.includes('almacen') || val.includes('almacén') || val.includes('ubicacion') || val.includes('ubicación')) colIndexes.warehouse = cIdx;
      });
      break;
    }

    if (rowStr.includes('categor') && rowStr.includes('descripci') && (rowStr.includes('cantidad') || rowStr.includes('precio'))) {
      headerRowIndex = r;
      detectedFormat = rowStr.includes('cantidad') ? 'HIDROZULCA_EXCEL' : 'PRICE_LIST';
      row.forEach((colVal, cIdx) => {
        const val = cleanString(colVal).toLowerCase();
        if (val.includes('categor')) colIndexes.category = cIdx;
        if (val.includes('descripci') || val.includes('nombre') || val.includes('producto')) colIndexes.name = cIdx;
        if (val.includes('cantidad') || val.includes('stock')) colIndexes.quantity = cIdx;
        if (val.includes('precio')) colIndexes.price = cIdx;
      });
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    const row = rawRows[0] || [];
    row.forEach((colVal, cIdx) => {
      const val = cleanString(colVal).toLowerCase();
      if (val.includes('sku') || val.includes('codigo')) colIndexes.sku = cIdx;
      else if (val.includes('categor')) colIndexes.category = cIdx;
      else if (val.includes('descrip') || val.includes('nombre') || val.includes('name')) colIndexes.name = cIdx;
      else if (val.includes('cant') || val.includes('stock')) colIndexes.quantity = cIdx;
      else if (val.includes('prec') || val.includes('price')) colIndexes.price = cIdx;
      else if (val.includes('cost')) colIndexes.costUsd = cIdx;
    });
    if (colIndexes.name === undefined) {
      colIndexes = { category: 0, name: 1, quantity: 2, price: 3 };
      headerRowIndex = -1;
    }
  }

  const products: ParsedProductRow[] = [];
  const errors: string[] = [];
  const existingSkus = new Set<string>();

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rawName = colIndexes.name !== undefined ? cleanString(row[colIndexes.name]) : '';
    if (!rawName) continue;

    const upperName = rawName.toUpperCase();
    if (upperName.includes('TOTAL') || upperName.includes('RESUMEN') || upperName.includes('SUBTOTAL')) {
      continue;
    }

    const rawCategory = colIndexes.category !== undefined ? cleanString(row[colIndexes.category]) : 'General';
    const rawQty = colIndexes.quantity !== undefined ? row[colIndexes.quantity] : 0;
    const rawPrice = colIndexes.price !== undefined ? row[colIndexes.price] : 0;
    const rawCost = colIndexes.costUsd !== undefined ? row[colIndexes.costUsd] : 0;
    const rawTax = colIndexes.taxRate !== undefined ? row[colIndexes.taxRate] : 16;
    const rawUnit = colIndexes.unit !== undefined ? cleanString(row[colIndexes.unit]) : 'unidades';
    const rawWarehouse = colIndexes.warehouse !== undefined ? cleanString(row[colIndexes.warehouse]) : undefined;
    const explicitSku = colIndexes.sku !== undefined ? cleanString(row[colIndexes.sku]).toUpperCase() : '';

    const priceUsd = parseNumber(rawPrice, 0);
    const initialStock = Math.max(0, parseNumber(rawQty, 0));
    const costUsd = parseNumber(rawCost, 0);
    const taxRate = parseNumber(rawTax, 16);

    const sku = explicitSku || generateCleanSku(rawCategory, rawName, existingSkus);

    products.push({
      sku,
      name: rawName,
      category: rawCategory || 'General',
      costUsd,
      priceUsd,
      taxRate: taxRate === 0 ? 0 : taxRate,
      taxType: taxRate === 0 ? 'EXEMPT' : 'TAXABLE',
      initialStock,
      unitOfMeasure: rawUnit || 'unidades',
      warehouseCode: rawWarehouse
    });
  }

  return {
    products,
    detectedFormat,
    sheetName: targetSheetName,
    availableSheets,
    totalRows: products.length,
    errors
  };
}
