import { Client, Message, Chat, Contact as WWebContact } from 'whatsapp-web.js';

// Tipos extendidos para compatibilidad con el sistema existente
export interface ExtendedClient extends Client {
  id?: number;
  name?: string;
  companyId?: number;
}

// Interfaz para mensajes que mantiene compatibilidad con el sistema Baileys anterior
export interface ExtendedMessage extends Message {
  // Propiedades adicionales para compatibilidad
  key?: {
    remoteJid?: string;
    fromMe?: boolean;
    id?: string;
  };
  messageTimestamp?: number;
  quotedMessage?: any;
}

// Interfaz para contactos extendida
export interface ExtendedContact extends WWebContact {
  profilePicUrl?: string;
}

// Interfaz para chats extendida  
export interface ExtendedChat extends Chat {
  lastMessage?: Message;
}

// Tipos de eventos de WhatsApp Web JS
export enum WWebEvents {
  QR_RECEIVED = 'qr',
  AUTHENTICATED = 'authenticated', 
  AUTHENTICATION_FAILURE = 'auth_failure',
  READY = 'ready',
  MESSAGE_RECEIVED = 'message',
  MESSAGE_CREATE = 'message_create',
  MESSAGE_REVOKED_EVERYONE = 'message_revoked_everyone',
  MESSAGE_REVOKED_ME = 'message_revoked_me',
  MESSAGE_ACK = 'message_ack',
  MESSAGE_EDIT = 'message_edit',
  UNREAD_COUNT = 'unread_count',
  CONTACT_CHANGED = 'contact_changed',
  GROUP_JOIN = 'group_join',
  GROUP_LEAVE = 'group_leave',
  GROUP_UPDATE = 'group_update',
  DISCONNECTED = 'disconnected',
  STATE_CHANGED = 'change_state'
}

// Estados de conexión
export enum ConnectionState {
  CONFLICT = 'CONFLICT',
  CONNECTED = 'CONNECTED', 
  DEPRECATED_VERSION = 'DEPRECATED_VERSION',
  OPENING = 'OPENING',
  PAIRING = 'PAIRING',
  SMB_TOS_BLOCK = 'SMB_TOS_BLOCK',
  TIMEOUT = 'TIMEOUT',
  TOS_BLOCK = 'TOS_BLOCK',
  UNLAUNCHED = 'UNLAUNCHED',
  UNPAIRED = 'UNPAIRED',
  UNPAIRED_IDLE = 'UNPAIRED_IDLE'
}

// Estados de ACK de mensajes
export enum MessageAck {
  ACK_ERROR = -1,
  ACK_PENDING = 0, 
  ACK_SERVER = 1,
  ACK_DEVICE = 2,
  ACK_READ = 3,
  ACK_PLAYED = 4
}

// Tipos de mensajes soportados
export enum MessageTypes {
  TEXT = 'chat',
  AUDIO = 'audio', 
  VOICE = 'ptt',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  STICKER = 'sticker',
  LOCATION = 'location',
  VCARD = 'vcard',
  MULTI_VCARD = 'multi_vcard',
  REVOKED = 'revoked',
  ORDER = 'order',
  PRODUCT = 'product',
  UNKNOWN = 'unknown',
  GROUP_INVITE = 'group_invite',
  LIST = 'list',
  LIST_RESPONSE = 'list_response',
  BUTTONS_RESPONSE = 'buttons_response',
  PAYMENT = 'payment',
  CALL_LOG = 'call_log'
}

// Interfaz para datos de medios
export interface MediaData {
  mimetype: string;
  data: string;
  filename?: string;
  filesize?: number;
}

// Interfaz para información de WhatsApp  
export interface WhatsAppInfo {
  wid: {
    user: string;
    server: string;
    _serialized: string;
  };
  pushname: string;
  me: {
    user: string;
    server: string; 
    _serialized: string;
  };
  connected: boolean;
  battery: number;
  plugged: boolean;
  platform: string;
}

// Interfaz para ubicación
export interface LocationMessage {
  latitude: number;
  longitude: number;
  description?: string;
}

// Interfaz para VCard
export interface VCardContact {
  displayName: string;
  vcard: string;
}

// Interfaz para respuesta de lista
export interface ListResponse {
  title: string;
  listType: number;
  singleSelectReply: {
    selectedRowId: string;
  };
}

// Interfaz para respuesta de botones  
export interface ButtonResponse {
  selectedButtonId: string;
}

// Interfaz para configuración de cliente
export interface ClientConfig {
  authStrategy: any;
  puppeteer?: {
    headless?: boolean;
    args?: string[];
    timeout?: number;
    executablePath?: string;
  };
  webVersionCache?: {
    type: 'local' | 'remote';
    remotePath?: string;
    localPath?: string;
  };
  ffmpegPath?: string;
  bypassCSP?: boolean;
  userAgent?: string;
}

// Helper para conversión de tipos
export class MessageHelper {
  static extractMessageContent(message: ExtendedMessage): any {
    return {
      conversation: message.body,
      messageContextInfo: {
        deviceListMetadata: {},
        deviceListMetadataVersion: 2
      }
    };
  }

  static getContentType(message: ExtendedMessage): string {
    if (message.hasMedia) {
      return message.type;
    }
    return 'conversation';
  }

  static formatPhoneNumber(number: string): string {
    // Remover caracteres no numéricos excepto +
    let cleaned = number.replace(/[^\d+]/g, '');
    
    // Remover + del inicio si existe
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // Agregar @c.us si no lo tiene
    if (!cleaned.includes('@')) {
      cleaned = `${cleaned}@c.us`;
    }
    
    return cleaned;
  }

  static isGroupMessage(message: ExtendedMessage): boolean {
    return message.from.includes('@g.us');
  }

  static getMessageId(message: ExtendedMessage): string {
    return message.id._serialized;
  }
}

export default {
  WWebEvents,
  ConnectionState,
  MessageAck,
  MessageTypes,
  MessageHelper
};