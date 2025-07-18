import { logger } from "../utils/logger";

interface RequiredEnvVars {
  NODE_ENV: string;
  DB_DIALECT: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
  DB_USER: string;
  DB_PASS: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  BACKEND_URL: string;
  FRONTEND_URL: string;
  REDIS_URI: string;
}

const validateEnv = (): void => {
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'NODE_ENV',
    'DB_DIALECT',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASS',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'BACKEND_URL',
    'FRONTEND_URL',
    'REDIS_URI'
  ];

  const missingVars: string[] = [];
  const weakSecrets: string[] = [];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    
    if (!value) {
      missingVars.push(varName);
      return;
    }

    // Validar secretos JWT seguros
    if ((varName === 'JWT_SECRET' || varName === 'JWT_REFRESH_SECRET')) {
      if (value.length < 32) {
        weakSecrets.push(`${varName} debe tener al menos 32 caracteres`);
      }
      if (value === 'mysecret' || value === 'myanothersecret') {
        weakSecrets.push(`${varName} está usando un valor por defecto inseguro`);
      }
    }

    // Validar contraseña de base de datos
    if (varName === 'DB_PASS') {
      if (value.length < 8) {
        weakSecrets.push('DB_PASS debe tener al menos 8 caracteres');
      }
    }
  });

  if (missingVars.length > 0) {
    logger.error('Variables de entorno requeridas faltantes:', missingVars);
    throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
  }

  if (weakSecrets.length > 0) {
    logger.error('Problemas de seguridad en variables de entorno:', weakSecrets);
    throw new Error(`Problemas de seguridad: ${weakSecrets.join(', ')}`);
  }

  logger.info('✅ Validación de variables de entorno completada exitosamente');
};

export { validateEnv };