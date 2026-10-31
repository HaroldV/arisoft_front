import * as XLSX from 'xlsx';

export interface ParsedPartyRow {
  name: string;
  tax_id: string;
  email?: string;
  phone?: string;
  address?: string;
  delivery_address?: string;
  zone_code: string;
  taxpayer_type: string;
  // Specific to provider
  is_retention_agent?: boolean;
  retention_percentage?: number;
  islr_percentage?: number;
  islr_concept_code?: string;
}

export interface PartyParseResult {
  items: ParsedPartyRow[];
  sheetName: string;
  availableSheets: string[];
  totalRows: number;
  errors: string[];
}

function cleanString(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function formatTaxId(raw: any): string {
  if (!raw) return '';
  let str = String(raw).trim().toUpperCase();
  
  // If it's pure numbers, e.g. 26872809 or 400601814
  const numericOnly = str.replace(/\D/g, '');
  if (!numericOnly) return str;

  const firstChar = str[0];
  const hasLetterPrefix = ['V', 'J', 'G', 'E', 'P'].includes(firstChar);
  const prefix = hasLetterPrefix ? firstChar : (numericOnly.length <= 8 ? 'V' : 'J');

  // Format with hyphens: Prefix-Number-CheckDigit (e.g., J-40060181-4 or V-26872809)
  if (numericOnly.length >= 9) {
    const main = numericOnly.slice(0, 8);
    const check = numericOnly.slice(8, 9);
    return `${prefix}-${main}-${check}`;
  }
  return `${prefix}-${numericOnly}`;
}

const STATE_MAPPING: { [key: string]: string } = {
  'distrito capital': 'DC',
  'caracas': 'DC',
  'amazonas': 'AM',
  'anzoátegui': 'AN',
  'anzoategui': 'AN',
  'apure': 'AP',
  'aragua': 'AR',
  'barinas': 'BA',
  'bolívar': 'BO',
  'bolivar': 'BO',
  'carabobo': 'CA',
  'cojedes': 'CO',
  'delta amacuro': 'DA',
  'falcón': 'FA',
  'falcon': 'FA',
  'guárico': 'GU',
  'guarico': 'GU',
  'lara': 'LA',
  'mérida': 'ME',
  'merida': 'ME',
  'miranda': 'MI',
  'monagas': 'MO',
  'nueva esparta': 'NE',
  'portuguesa': 'PO',
  'sucre': 'SU',
  'táchira': 'TA',
  'tachira': 'TA',
  'trujillo': 'TR',
  'la guaira': 'VA',
  'vargas': 'VA',
  'yaracuy': 'YA',
  'zulia': 'ZU',
};

function parseZoneCode(val: any): string {
  if (!val) return 'DC';
  const clean = cleanString(val).toLowerCase();
  if (STATE_MAPPING[clean]) return STATE_MAPPING[clean];
  const upper = clean.toUpperCase();
  if (Object.values(STATE_MAPPING).includes(upper)) return upper;
  return 'DC';
}

function parseTaxpayerType(val: any): string {
  if (!val) return 'ORDINARY';
  const str = cleanString(val).toUpperCase();
  if (str.includes('ESP')) return 'ESPECIAL';
  if (str.includes('EXEN') || str.includes('FORMAL') || str.includes('NO')) return 'EXEMPT';
  return 'ORDINARY';
}

function parseBooleanAgent(val: any): boolean {
  if (!val) return false;
  const str = cleanString(val).toUpperCase();
  return str === 'SI' || str === 'SÍ' || str === 'TRUE' || str === '1' || str.includes('RETENCION');
}

export function parsePartyFile(
  dataBuffer: ArrayBuffer | Uint8Array,
  partyType: 'client' | 'provider',
  selectedSheet?: string,
  fileName?: string
): PartyParseResult {
  let workbook: XLSX.WorkBook;
  const isCsv = fileName ? fileName.toLowerCase().endsWith('.csv') : false;

  try {
    if (isCsv) {
      const uint8 = dataBuffer instanceof Uint8Array ? dataBuffer : new Uint8Array(dataBuffer);
      const text = new TextDecoder('utf-8').decode(uint8);
      workbook = XLSX.read(text, { type: 'string' });
    } else {
      workbook = XLSX.read(dataBuffer, { type: 'array' });
    }
  } catch {
    workbook = XLSX.read(dataBuffer, { type: 'array' });
  }

  const availableSheets = workbook.SheetNames;
  let targetSheetName = selectedSheet || availableSheets[0];
  const sheet = workbook.Sheets[targetSheetName];

  if (!sheet) {
    throw new Error(`La hoja "${targetSheetName}" no fue encontrada en el archivo.`);
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
  if (rawRows.length === 0) {
    return {
      items: [],
      sheetName: targetSheetName,
      availableSheets,
      totalRows: 0,
      errors: ['El archivo o la hoja seleccionada está vacía.']
    };
  }

  // Detect header row
  let headerRowIndex = -1;
  const colIndexes: { [key: string]: number } = {};

  for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
    const row = rawRows[r] || [];
    const rowStr = row.map(c => cleanString(c).toLowerCase()).join(' | ');

    if (
      (rowStr.includes('descrip') || rowStr.includes('nombre') || rowStr.includes('razon') || rowStr.includes('razón')) &&
      (rowStr.includes('rif') || rowStr.includes('r.i.f') || rowStr.includes('cedula') || rowStr.includes('cédula') || rowStr.includes('documento'))
    ) {
      headerRowIndex = r;
      row.forEach((colVal, cIdx) => {
        const val = cleanString(colVal).toLowerCase();
        if (val.includes('descrip') || val.includes('nombre') || val.includes('razon') || val.includes('razón') || val.includes('cliente') || val.includes('proveedor')) {
          colIndexes.name = cIdx;
        } else if (val.includes('rif') || val.includes('r.i.f') || val.includes('cedula') || val.includes('cédula') || val.includes('documento') || val.includes('tax_id')) {
          colIndexes.tax_id = cIdx;
        } else if (val.includes('despacho') || val.includes('entrega')) {
          colIndexes.delivery_address = cIdx;
        } else if (val.includes('direcci') || val.includes('direccion') || val.includes('fiscal')) {
          colIndexes.address = cIdx;
        } else if (val.includes('tel') || val.includes('phone') || val.includes('celular')) {
          colIndexes.phone = cIdx;
        } else if (val.includes('mail') || val.includes('correo')) {
          colIndexes.email = cIdx;
        } else if (val.includes('retenc') || val.includes('agente')) {
          colIndexes.retention_agent = cIdx;
        } else if (val.includes('contribuyente') || val.includes('taxpayer')) {
          colIndexes.taxpayer_type = cIdx;
        } else if (val.includes('estado') || val.includes('zona') || val.includes('region')) {
          colIndexes.zone_code = cIdx;
        } else if (val.includes('% retenci') || val.includes('retención iva') || val.includes('retencion iva')) {
          colIndexes.retention_percentage = cIdx;
        } else if (val.includes('islr') && (val.includes('%') || val.includes('porcent'))) {
          colIndexes.islr_percentage = cIdx;
        } else if (val.includes('concepto')) {
          colIndexes.islr_concept = cIdx;
        }
      });
      break;
    }
  }

  if (headerRowIndex === -1) {
    // Fallback: first row
    headerRowIndex = 0;
    colIndexes.name = 0;
    colIndexes.tax_id = 1;
  }

  const items: ParsedPartyRow[] = [];
  const errors: string[] = [];
  const seenTaxIds = new Set<string>();

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rawName = colIndexes.name !== undefined ? cleanString(row[colIndexes.name]) : '';
    const rawTaxId = colIndexes.tax_id !== undefined ? cleanString(row[colIndexes.tax_id]) : '';

    // Ignore placeholder / instructions or purely empty rows
    if (!rawName || rawName === '.' || rawName.includes('INVERSIONES & COMERCIALIZADORA')) continue;
    if (rawName.toUpperCase().includes('TOTAL') || rawName.toUpperCase().includes('RESUMEN')) continue;

    const formattedTax = formatTaxId(rawTaxId);
    if (!formattedTax || formattedTax === '0' || formattedTax === '--00--') {
      // If no valid tax ID, generate a fallback or skip if missing
      continue;
    }

    if (seenTaxIds.has(formattedTax)) {
      continue; // Skip duplicate inside same sheet
    }
    seenTaxIds.add(formattedTax);

    const address = colIndexes.address !== undefined ? cleanString(row[colIndexes.address]) : undefined;
    const deliveryAddress = colIndexes.delivery_address !== undefined ? cleanString(row[colIndexes.delivery_address]) : undefined;
    const phone = colIndexes.phone !== undefined ? cleanString(row[colIndexes.phone]) : undefined;
    const email = colIndexes.email !== undefined ? cleanString(row[colIndexes.email]) : undefined;
    const zoneVal = colIndexes.zone_code !== undefined ? row[colIndexes.zone_code] : undefined;
    const taxpayerVal = colIndexes.taxpayer_type !== undefined ? row[colIndexes.taxpayer_type] : undefined;
    const isAgent = colIndexes.retention_agent !== undefined ? parseBooleanAgent(row[colIndexes.retention_agent]) : false;

    const parsedItem: ParsedPartyRow = {
      name: rawName,
      tax_id: formattedTax,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      delivery_address: deliveryAddress || address || undefined,
      zone_code: parseZoneCode(zoneVal),
      taxpayer_type: parseTaxpayerType(taxpayerVal || (isAgent ? 'ESPECIAL' : 'ORDINARY')),
      is_retention_agent: isAgent,
      retention_percentage: isAgent ? 75 : 0,
      islr_percentage: 2.0,
      islr_concept_code: 'SERVICES'
    };

    items.push(parsedItem);
  }

  return {
    items,
    sheetName: targetSheetName,
    availableSheets,
    totalRows: items.length,
    errors
  };
}
