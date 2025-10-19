import { Request } from 'express';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  validatedData?: any;
}

export interface ValidationRule {
  field: string;
  rules: string[];
  optional?: boolean;
}
export class Validator {
  private rules: ValidationRule[] = [];
  private data: any = {};

  constructor(data: any) {
    this.data = data;
  }

  
  addRule(field: string, rules: string[], optional: boolean = false): this {
    this.rules.push({ field, rules, optional });
    return this;
  }
   
  validate(): ValidationResult {
    const errors: string[] = [];
    const validatedData: any = {};

    for (const rule of this.rules) {
      const value = this.data[rule.field];
      
      
      if (rule.optional && (value === undefined || value === null || value === '')) {
        continue;
      }

       
      if (!rule.optional && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

       
      for (const validationRule of rule.rules) {
        const error = this.applyRule(rule.field, value, validationRule);
        if (error) {
          errors.push(error);
          break;
        }
      }

       
      if (!errors.some(error => error.includes(rule.field))) {
        validatedData[rule.field] = this.formatValue(value, rule.rules);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedData: errors.length === 0 ? validatedData : undefined,
    };
  }
   
  private applyRule(field: string, value: any, rule: string): string | null {
    const [ruleName, param] = rule.split(':');

    switch (ruleName) {
      case 'string':
        if (typeof value !== 'string') return `${field} must be a string`;
        break;
      
      case 'number':
        if (isNaN(Number(value))) return `${field} must be a number`;
        break;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return `${field} must be a valid email`;
        break;
      
      case 'min':
        if (value.length < Number(param)) return `${field} must be at least ${param} characters`;
        break;
      
      case 'max':
        if (value.length > Number(param)) return `${field} must not exceed ${param} characters`;
        break;
      
      case 'in':
        const allowedValues = param.split(',');
        if (!allowedValues.includes(value)) return `${field} must be one of: ${allowedValues.join(', ')}`;
        break;
      
      case 'regex':
        const regex = new RegExp(param);
        if (!regex.test(value)) return `${field} format is invalid`;
        break;
      
      case 'date':
        if (isNaN(Date.parse(value))) return `${field} must be a valid date`;
        break;
      
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          return `${field} must be a boolean`;
        }
        break;
      
      default:
        return `Unknown validation rule: ${ruleName}`;
    }

    return null;
  }
 
  private formatValue(value: any, rules: string[]): any {
    for (const rule of rules) {
      const [ruleName] = rule.split(':');
      
      if (ruleName === 'number' && !isNaN(Number(value))) {
        return Number(value);
      }
      
      if (ruleName === 'boolean') {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return Boolean(value);
      }
      
      if (ruleName === 'date' && !isNaN(Date.parse(value))) {
        return new Date(value);
      }
    }
    
    return value;
  }
  
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

   
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

   
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  
  static isStrongPassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/(?=.*[a-z])/.test(password)) errors.push('Password must contain lowercase letter');
    if (!/(?=.*[A-Z])/.test(password)) errors.push('Password must contain uppercase letter');
    if (!/(?=.*\d)/.test(password)) errors.push('Password must contain number');
    if (!/(?=.*[@$!%*?&])/.test(password)) errors.push('Password must contain special character');
    
    return { isValid: errors.length === 0, errors };
  }

   
  static validateRequest(req: Request, rules: ValidationRule[]): ValidationResult {
    const validator = new Validator(req.body);
    rules.forEach(rule => validator.addRule(rule.field, rule.rules, rule.optional));
    return validator.validate();
  }
   
  static readonly SCHEMAS = {
    EMAIL: ['required', 'email'],
    PASSWORD: ['required', 'string', 'min:6'],
    NAME: ['required', 'string', 'min:2', 'max:50'],
    PHONE: ['required', 'string', 'min:10', 'max:15'],
    DATE: ['required', 'date'],
    NUMBER: ['required', 'number'],
    BOOLEAN: ['required', 'boolean'],
  };

   
  static fromRequest(req: Request): Validator {
    return new Validator(req.body);
  }

   
  static validateField(field: string, value: any, rules: string[]): string | null {
    const validator = new Validator({ [field]: value });
    validator.addRule(field, rules);
    const result = validator.validate();
    return result.errors[0] || null;
  }
}

export default Validator;
