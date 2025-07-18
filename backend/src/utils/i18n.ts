/**
 * Sistema de internacionalización para el backend
 * Permite traducir mensajes automáticos y respuestas de error
 */

export interface TranslationMessages {
  [key: string]: {
    es: string;
    en: string;
    pt: string;
  };
}

// Mensajes de traducción para el backend
export const messages: TranslationMessages = {
  // Mensajes automáticos de WhatsApp
  CALL_DISABLED_MESSAGE: {
    es: "*Mensaje Automático:*\n\nLas llamadas de voz y vídeo están deshabilitadas para este WhatsApp, favor enviar un mensaje de texto. Gracias",
    en: "*Automatic Message:*\n\nVoice and video calls are disabled for this WhatsApp, please send a text message. Thank you",
    pt: "*Mensagem Automática:*\n\nAs chamadas de voz e vídeo estão desabilitas para esse WhatsApp, favor enviar uma mensagem de texto. Obrigado"
  },
  
  CALL_LOG_MESSAGE: {
    es: "Llamada de voz/vídeo perdida a las {time}",
    en: "Missed voice/video call at {time}",
    pt: "Chamada de voz/vídeo perdida às {time}"
  },

  // Mensajes de horario de atención
  OUT_OF_HOURS_MESSAGE: {
    es: "Estamos fuera del horario de atención. Nuestro horario es de {startTime} a {endTime}. Su mensaje será atendido en el próximo horario hábil.",
    en: "We are outside business hours. Our hours are from {startTime} to {endTime}. Your message will be attended during the next business hours.",
    pt: "Estamos fora do horário de atendimento. Nosso horário é das {startTime} às {endTime}. Sua mensagem será atendida no próximo horário útil."
  },

  // Mensajes del sistema de colas/chatbot
  QUEUE_GREETING: {
    es: "¡Hola! Bienvenido a nuestro servicio de atención. Por favor selecciona una opción:",
    en: "Hello! Welcome to our customer service. Please select an option:",
    pt: "Olá! Bem-vindo ao nosso atendimento. Por favor, selecione uma opção:"
  },

  QUEUE_INVALID_OPTION: {
    es: "Opción inválida. Por favor selecciona una opción válida del menú.",
    en: "Invalid option. Please select a valid option from the menu.",
    pt: "Opção inválida. Por favor, selecione uma opção válida do menu."
  },

  QUEUE_BACK_TO_MENU: {
    es: "*[ # ]* - Menú inicial",
    en: "*[ # ]* - Main menu",
    pt: "*[ # ]* - Menu inicial"
  },

  // Mensajes de transferencia
  TRANSFER_QUEUE_MESSAGE: {
    es: "Su consulta ha sido transferida al departamento correspondiente. Un agente lo atenderá pronto.",
    en: "Your inquiry has been transferred to the corresponding department. An agent will assist you soon.",
    pt: "Sua consulta foi transferida para o departamento correspondente. Um agente irá atendê-lo em breve."
  },

  // Mensajes de error para usuarios
  ERROR_SENDING_MESSAGE: {
    es: "Error al enviar el mensaje. Por favor intente nuevamente.",
    en: "Error sending message. Please try again.",
    pt: "Erro ao enviar mensagem. Por favor, tente novamente."
  },

  ERROR_MEDIA_PROCESSING: {
    es: "Error al procesar el archivo multimedia. Verifique el formato y tamaño.",
    en: "Error processing media file. Please check format and size.",
    pt: "Erro ao processar arquivo de mídia. Verifique o formato e tamanho."
  },

  // Mensajes de validación
  INVALID_PHONE_NUMBER: {
    es: "Número de teléfono inválido.",
    en: "Invalid phone number.",
    pt: "Número de telefone inválido."
  },

  // Mensajes de estado del sistema
  WHATSAPP_DISCONNECTED: {
    es: "WhatsApp desconectado. Reconectando...",
    en: "WhatsApp disconnected. Reconnecting...",
    pt: "WhatsApp desconectado. Reconectando..."
  },

  WHATSAPP_CONNECTED: {
    es: "WhatsApp conectado exitosamente.",
    en: "WhatsApp connected successfully.",
    pt: "WhatsApp conectado com sucesso."
  },

  // Mensajes de rating/satisfacción
  RATING_REQUEST: {
    es: "¿Cómo calificarías nuestro servicio? Responde con un número del 1 al 5:",
    en: "How would you rate our service? Reply with a number from 1 to 5:",
    pt: "Como você avaliaria nosso atendimento? Responda com um número de 1 a 5:"
  },

  RATING_THANK_YOU: {
    es: "¡Gracias por tu calificación! Tu opinión es muy importante para nosotros.",
    en: "Thank you for your rating! Your feedback is very important to us.",
    pt: "Obrigado pela sua avaliação! Sua opinião é muito importante para nós."
  },

  // Mensajes de archivos
  FILE_ATTACHMENT: {
    es: "📎 Archivo adjunto",
    en: "📎 File attachment",
    pt: "📎 Arquivo anexo"
  }
};

/**
 * Función para obtener mensaje traducido
 * @param key - Clave del mensaje
 * @param lang - Idioma (es, en, pt)
 * @param params - Parámetros para reemplazar en el mensaje
 */
export function t(key: string, lang: 'es' | 'en' | 'pt' = 'es', params?: Record<string, string>): string {
  const message = messages[key];
  
  if (!message) {
    console.warn(`Translation key "${key}" not found`);
    return key;
  }

  let translatedMessage = message[lang] || message.es; // Fallback a español

  // Reemplazar parámetros si existen
  if (params) {
    Object.keys(params).forEach(param => {
      translatedMessage = translatedMessage.replace(`{${param}}`, params[param]);
    });
  }

  return translatedMessage;
}

/**
 * Detectar idioma preferido basado en configuración de la empresa o usuario
 * @param companyId - ID de la empresa
 * @returns Idioma detectado
 */
export async function detectLanguage(companyId?: number): Promise<'es' | 'en' | 'pt'> {
  // TODO: Implementar lógica para detectar idioma basado en:
  // 1. Configuración de la empresa
  // 2. Configuración del usuario
  // 3. Localización del número de teléfono
  // 4. Headers de la petición
  
  // Por ahora, retornamos español como default
  return 'es';
}

/**
 * Función helper para obtener mensaje con detección automática de idioma
 */
export async function getLocalizedMessage(
  key: string, 
  companyId?: number, 
  params?: Record<string, string>
): Promise<string> {
  const lang = await detectLanguage(companyId);
  return t(key, lang, params);
}

export default { t, messages, detectLanguage, getLocalizedMessage };