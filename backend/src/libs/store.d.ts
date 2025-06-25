// Store types for whatsapp-web.js compatibility
// whatsapp-web.js maneja el store internamente, pero mantenemos estas interfaces
// para compatibilidad con el código existente

import { Chat as WWebChat, Contact as WWebContact, Message as WWebMessage } from 'whatsapp-web.js';

export interface Store {
  // Propiedades básicas para compatibilidad
  chats: Map<string, WWebChat>;
  contacts: Map<string, WWebContact>;
  messages: Map<string, WWebMessage[]>;
  
  // Métodos de compatibilidad (implementación simplificada)
  bind?: (client: any) => void;
  loadMessages?: (chatId: string, count: number) => Promise<WWebMessage[]>;
  loadMessage?: (chatId: string, messageId: string) => Promise<WWebMessage | null>;
  
  // Métodos de serialización
  toJSON?: () => any;
  fromJSON?: (data: any) => void;
  writeToFile?: (path: string) => void;
  readFromFile?: (path: string) => void;
}

// Interfaz simplificada para el nuevo sistema
export interface WWebStore {
  chats: WWebChat[];
  contacts: WWebContact[];
  recentMessages: WWebMessage[];
}

// Helper para crear un store mock para compatibilidad
export const createMockStore = (): Store => {
  return {
    chats: new Map(),
    contacts: new Map(), 
    messages: new Map(),
    
    bind: () => {
      // whatsapp-web.js maneja esto internamente
    },
    
    loadMessages: async (chatId: string, count: number) => {
      // Implementación simplificada - whatsapp-web.js maneja esto
      return [];
    },
    
    loadMessage: async (chatId: string, messageId: string) => {
      // Implementación simplificada
      return null;
    },
    
    toJSON: () => ({}),
    fromJSON: () => {},
    writeToFile: () => {},
    readFromFile: () => {}
  };
};
