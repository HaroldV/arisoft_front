import { RIF_TYPES, RifType } from '@/constants/domain-constants';

export interface RifValidationResult {
  isValid: boolean;
  formattedRif: string;
  type?: RifType;
  error?: string;
}

export class RifValidator {
  private static readonly TYPE_WEIGHTS: Record<string, number> = {
    V: 1,
    E: 2,
    J: 3,
    P: 4,
    G: 5,
  };

  private static readonly MULTIPLIERS = [3, 2, 7, 6, 5, 4, 3, 2];

  public static validate(rawRif: string): RifValidationResult {
    if (!rawRif || typeof rawRif !== 'string') {
      return { isValid: false, formattedRif: '', error: 'RIF no proporcionado' };
    }

    const clean = rawRif.toUpperCase().replace(/[^VJGEP0-9]/g, '');

    if (clean.length < 9 || clean.length > 10) {
      return { 
        isValid: false, 
        formattedRif: rawRif, 
        error: 'El RIF debe tener formato válido (ej. J-12345678-9)' 
      };
    }

    const typeChar = clean.charAt(0);
    if (!this.TYPE_WEIGHTS[typeChar]) {
      return { 
        isValid: false, 
        formattedRif: rawRif, 
        error: 'Tipo de RIF inválido. Debe iniciar con V, J, G, E o P' 
      };
    }

    const bodyDigits = clean.substring(1, clean.length - 1).padStart(8, '0');
    const expectedDigit = parseInt(clean.charAt(clean.length - 1), 10);

    if (isNaN(expectedDigit)) {
      return { 
        isValid: false, 
        formattedRif: rawRif, 
        error: 'Dígito verificador inválido' 
      };
    }

    let sum = this.TYPE_WEIGHTS[typeChar] * 4;

    for (let i = 0; i < 8; i++) {
      const digit = parseInt(bodyDigits.charAt(i), 10);
      if (isNaN(digit)) {
        return { isValid: false, formattedRif: rawRif, error: 'Dígitos numéricos inválidos' };
      }
      sum += digit * this.MULTIPLIERS[i];
    }

    const remainder = sum % 11;
    let calculatedDigit = 11 - remainder;

    if (calculatedDigit >= 10) {
      calculatedDigit = 0;
    }

    const isValid = calculatedDigit === expectedDigit;
    const formattedRif = `${typeChar}-${bodyDigits}-${expectedDigit}`;

    const typeMap: Record<string, RifType> = {
      J: RIF_TYPES.JURIDICO,
      V: RIF_TYPES.NATURAL_V,
      E: RIF_TYPES.NATURAL_E,
      G: RIF_TYPES.GUBERNAMENTAL,
      P: RIF_TYPES.PASAPORTE,
    };

    return {
      isValid,
      formattedRif,
      type: typeMap[typeChar],
      error: isValid ? undefined : `Dígito verificador SENIAT incorrecto (calculado: ${calculatedDigit})`,
    };
  }

  public static calculateChecksumDigit(typeChar: string, bodyNumber: string): number | null {
    if (!typeChar || !this.TYPE_WEIGHTS[typeChar.toUpperCase()]) return null;
    const cleanNum = bodyNumber.replace(/\D/g, '');
    if (!cleanNum) return null;

    const paddedNum = cleanNum.padStart(8, '0').slice(-8);
    let sum = this.TYPE_WEIGHTS[typeChar.toUpperCase()] * 4;

    for (let i = 0; i < 8; i++) {
      const digit = parseInt(paddedNum.charAt(i), 10);
      if (isNaN(digit)) return null;
      sum += digit * this.MULTIPLIERS[i];
    }

    const remainder = sum % 11;
    let calculatedDigit = 11 - remainder;
    if (calculatedDigit >= 10) {
      calculatedDigit = 0;
    }
    return calculatedDigit;
  }
}
