import { errorLogger } from './error-logger';

// Tipos de validação
type ValidationRule<T> = {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function';
  validator?: (value: T) => boolean;
  message?: string;
};

type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

// Validador de props
export class PropValidator {
  static validate<T extends Record<string, any>>(
    props: T,
    schema: ValidationSchema<T>,
    componentName: string
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [propName, rule] of Object.entries(schema)) {
      const value = props[propName];
      const propPath = `${componentName}.${propName}`;

      // Verificar se é obrigatório
      if (rule?.required && (value === undefined || value === null)) {
        errors.push(`${propPath} é obrigatório`);
        continue;
      }

      // Se o valor não existe e não é obrigatório, pular
      if (value === undefined || value === null) {
        continue;
      }

      // Verificar tipo
      if (rule?.type) {
        const isValidType = this.checkType(value, rule.type);
        if (!isValidType) {
          errors.push(`${propPath} deve ser do tipo ${rule.type}, recebeu ${typeof value}`);
        }
      }

      // Verificar validador customizado
      if (rule?.validator && !rule.validator(value)) {
        errors.push(rule.message || `${propPath} falhou na validação customizada`);
      }

      // Verificações específicas para objetos
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.validateObject(value, propPath, errors);
      }

      // Verificações específicas para arrays
      if (Array.isArray(value)) {
        this.validateArray(value, propPath, errors);
      }
    }

    // Log de erros se houver
    if (errors.length > 0) {
      const errorMessage = `Prop validation failed for ${componentName}: ${errors.join(', ')}`;
      errorLogger.logError(new Error(errorMessage), componentName, props);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static checkType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'function':
        return typeof value === 'function';
      default:
        return true;
    }
  }

  private static validateObject(obj: any, propPath: string, errors: string[]) {
    // Verificar se o objeto tem propriedades que podem causar problemas
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = `${propPath}.${key}`;

      // Verificar se há propriedades que podem causar erro React #130
      if (this.isInvalidPropValue(value)) {
        errors.push(`${fullPath} contém valor inválido que pode causar erro React #130`);
      }

      // Verificar profundidade do objeto
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const depth = this.getObjectDepth(value);
        if (depth > 10) {
          errors.push(`${fullPath} tem profundidade excessiva (${depth} níveis)`);
        }
      }
    }
  }

  private static validateArray(arr: any[], propPath: string, errors: string[]) {
    // Verificar tamanho do array
    if (arr.length > 1000) {
      errors.push(`${propPath} tem tamanho excessivo (${arr.length} itens)`);
    }

    // Verificar itens do array
    arr.forEach((item, index) => {
      const itemPath = `${propPath}[${index}]`;
      
      if (this.isInvalidPropValue(item)) {
        errors.push(`${itemPath} contém valor inválido que pode causar erro React #130`);
      }
    });
  }

  private static isInvalidPropValue(value: any): boolean {
    // Verificar valores que podem causar erro React #130
    if (value === undefined || value === null) {
      return false; // Valores nulos são válidos
    }

    // Verificar se é um objeto com propriedades inválidas
    if (typeof value === 'object' && value !== null) {
      // Verificar se tem propriedades que começam com números
      const keys = Object.keys(value);
      if (keys.some(key => /^\d/.test(key))) {
        return true;
      }

      // Verificar se tem propriedades com caracteres especiais
      if (keys.some(key => /[^a-zA-Z0-9_]/.test(key))) {
        return true;
      }

      // Verificar se tem propriedades muito longas
      if (keys.some(key => key.length > 50)) {
        return true;
      }
    }

    return false;
  }

  private static getObjectDepth(obj: any, currentDepth = 0): number {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return currentDepth;
    }

    const maxDepth = Math.max(
      currentDepth,
      ...Object.values(obj).map(value => 
        this.getObjectDepth(value, currentDepth + 1)
      )
    );

    return maxDepth;
  }

  // Validador específico para componentes React
  static validateReactProps<T extends Record<string, any>>(
    props: T,
    schema: ValidationSchema<T>,
    componentName: string
  ): T {
    const validation = this.validate(props, schema, componentName);

    if (!validation.isValid) {
      console.warn(`⚠️ Prop validation failed for ${componentName}:`, validation.errors);
      
      // Em desenvolvimento, lançar erro para facilitar debugging
      if (process.env.NODE_ENV === 'development') {
        throw new Error(`Prop validation failed: ${validation.errors.join(', ')}`);
      }
    }

    return props;
  }

  // Schemas predefinidos para componentes comuns
  static schemas = {
    button: {
      onClick: { type: 'function' as const },
      disabled: { type: 'boolean' as const },
      className: { type: 'string' as const },
      children: { required: true },
    },
    input: {
      value: { type: 'string' as const },
      onChange: { type: 'function' as const },
      placeholder: { type: 'string' as const },
      type: { type: 'string' as const },
    },
    card: {
      title: { type: 'string' as const, required: true },
      content: { type: 'string' as const },
      onClick: { type: 'function' as const },
    },
  };
}

// Hook para validação de props em componentes funcionais
export function usePropValidation<T extends Record<string, any>>(
  props: T,
  schema: ValidationSchema<T>,
  componentName: string
) {
  const validation = PropValidator.validate(props, schema, componentName);
  
  return {
    ...props,
    isValid: validation.isValid,
    errors: validation.errors,
  };
}

// Decorator para validação automática (TypeScript)
export function withPropValidation<T extends Record<string, any>>(
  schema: ValidationSchema<T>
) {
  return function <P extends T>(Component: React.ComponentType<P>) {
    return function ValidatedComponent(props: P) {
      const validatedProps = PropValidator.validateReactProps(props, schema, Component.name);
      return <Component {...validatedProps} />;
    };
  };
} 