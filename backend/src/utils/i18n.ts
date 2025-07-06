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
  },

  // Mensajes de error del backend para las APIs
  ERR_NO_OTHER_WHATSAPP: {
    es: "Debe haber al menos un WhatsApp predeterminado.",
    en: "There must be at least one default WhatsApp.",
    pt: "Deve haver pelo menos um WhatsApp padrão."
  },
  ERR_NO_DEF_WAPP_FOUND: {
    es: "No se encontró WhatsApp predeterminado. Verifique la página de conexiones.",
    en: "No default WhatsApp found. Please check the connections page.",
    pt: "Nenhum WhatsApp padrão encontrado. Verifique a página de conexões."
  },
  ERR_WAPP_NOT_INITIALIZED: {
    es: "Esta sesión de WhatsApp no ha sido inicializada. Verifique la página de conexiones.",
    en: "This WhatsApp session has not been initialized. Please check the connections page.",
    pt: "Esta sessão do WhatsApp não foi inicializada. Verifique a página de conexões."
  },
  ERR_WAPP_CHECK_CONTACT: {
    es: "No se pudo verificar el contacto de WhatsApp. Verifique la página de conexiones.",
    en: "Could not check WhatsApp contact. Please check the connections page.",
    pt: "Não foi possível verificar o contato do WhatsApp. Verifique a página de conexões"
  },
  ERR_WAPP_INVALID_CONTACT: {
    es: "Este no es un número de WhatsApp válido.",
    en: "This is not a valid WhatsApp number.",
    pt: "Este não é um número de Whatsapp válido."
  },
  ERR_WAPP_DOWNLOAD_MEDIA: {
    es: "No se pudo descargar el contenido multimedia de WhatsApp. Verifique la página de conexiones.",
    en: "Could not download media from WhatsApp. Please check the connections page.",
    pt: "Não foi possível baixar mídia do WhatsApp. Verifique a página de conexões."
  },
  ERR_INVALID_CREDENTIALS: {
    es: "Error de autenticación. Por favor, inténtelo de nuevo.",
    en: "Authentication error. Please try again.",
    pt: "Erro de autenticação. Por favor, tente novamente."
  },
  ERR_SENDING_WAPP_MSG: {
    es: "Error al enviar mensaje de WhatsApp. Verifique la página de conexiones.",
    en: "Error sending WhatsApp message. Please check the connections page.",
    pt: "Erro ao enviar mensagem do WhatsApp. Verifique a página de conexões."
  },
  ERR_DELETE_WAPP_MSG: {
    es: "No se pudo eliminar el mensaje de WhatsApp.",
    en: "Could not delete WhatsApp message.",
    pt: "Não foi possível excluir a mensagem do WhatsApp."
  },
  ERR_OTHER_OPEN_TICKET: {
    es: "Ya existe un ticket abierto para este contacto.",
    en: "There is already an open ticket for this contact.",
    pt: "Já existe um tíquete aberto para este contato."
  },
  ERR_SESSION_EXPIRED: {
    es: "Sesión expirada. Por favor, inicie sesión.",
    en: "Session expired. Please log in.",
    pt: "Sessão expirada. Por favor entre."
  },
  ERR_USER_CREATION_DISABLED: {
    es: "La creación de usuarios ha sido deshabilitada por el administrador.",
    en: "User creation has been disabled by the administrator.",
    pt: "A criação do usuário foi desabilitada pelo administrador."
  },
  ERR_NO_PERMISSION: {
    es: "No tienes permiso para acceder a este recurso.",
    en: "You do not have permission to access this resource.",
    pt: "Você não tem permissão para acessar este recurso."
  },
  ERR_DUPLICATED_CONTACT: {
    es: "Ya existe un contacto con este número.",
    en: "A contact with this number already exists.",
    pt: "Já existe um contato com este número."
  },
  ERR_NO_SETTING_FOUND: {
    es: "No se encontró configuración con este ID.",
    en: "No setting found with this ID.",
    pt: "Nenhuma configuração encontrada com este ID."
  },
  ERR_NO_CONTACT_FOUND: {
    es: "No se encontró contacto con este ID.",
    en: "No contact found with this ID.",
    pt: "Nenhum contato encontrado com este ID."
  },
  ERR_NO_TICKET_FOUND: {
    es: "No se encontró ticket con este ID.",
    en: "No ticket found with this ID.",
    pt: "Nenhum tíquete encontrado com este ID."
  },
  ERR_NO_USER_FOUND: {
    es: "No se encontró usuario con este ID.",
    en: "No user found with this ID.",
    pt: "Nenhum usuário encontrado com este ID."
  },
  ERR_NO_WAPP_FOUND: {
    es: "No se encontró WhatsApp con este ID.",
    en: "No WhatsApp found with this ID.",
    pt: "Nenhum WhatsApp encontrado com este ID."
  },
  ERR_CREATING_MESSAGE: {
    es: "Error al crear mensaje en la base de datos.",
    en: "Error creating message in the database.",
    pt: "Erro ao criar mensagem no banco de dados."
  },
  ERR_CREATING_TICKET: {
    es: "Error al crear ticket en la base de datos.",
    en: "Error creating ticket in the database.",
    pt: "Erro ao criar tíquete no banco de dados."
  },
  ERR_FETCH_WAPP_MSG: {
    es: "Error al obtener el mensaje de WhatsApp, puede que sea muy antiguo.",
    en: "Error fetching message from WhatsApp, it might be too old.",
    pt: "Erro ao buscar a mensagem no WhtasApp, talvez ela seja muito antiga."
  },
  ERR_QUEUE_COLOR_ALREADY_EXISTS: {
    es: "Este color ya está en uso, elija otro.",
    en: "This color is already in use, please choose another.",
    pt: "Esta cor já está em uso, escolha outra."
  },
  ERR_WAPP_GREETING_REQUIRED: {
    es: "El mensaje de saludo es obligatorio cuando hay más de una cola.",
    en: "The greeting message is required when there is more than one queue.",
    pt: "A mensagem de saudação é obrigatório quando há mais de uma fila."
  },
  ERR_UNKNOWN_ERROR: {
    es: "¡Ha ocurrido un error desconocido!",
    en: "An unknown error has occurred!",
    pt: "Ocorreu um erro desconhecido!"
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