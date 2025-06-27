# 🔧 Frontend-Backend Integration Fixes

## 🔍 Errores Comunes Después de Migración Baileys → WhatsApp-Web.js

### 1. **Socket.IO Events Verification**
Verificar que los eventos Socket.IO sigan funcionando:

#### Frontend (`hooks/useWhatsApps/index.js`):
```javascript
// Líneas 81-97: Eventos que escucha el frontend
socket.on(`company-${companyId}-whatsapp`, (data) => {
  if (data.action === "update") {
    dispatch({ type: "UPDATE_WHATSAPPS", payload: data.whatsapp });
  }
});

socket.on(`company-${companyId}-whatsappSession`, (data) => {
  if (data.action === "update") {
    dispatch({ type: "UPDATE_SESSION", payload: data.session });
  }
});
```

#### Backend: Verificar que estos eventos se emitan correctamente
- `company-${companyId}-whatsapp`
- `company-${companyId}-whatsappSession`

### 2. **API Endpoints Verification**
Verificar endpoints críticos:

#### ✅ Endpoints que NO cambiaron:
- `GET /whatsapp/?session=0` - ✅ Funcional
- `POST /whatsapp` - ✅ Funcional  
- `PUT /whatsapp/:id` - ✅ Funcional
- `DELETE /whatsapp/:id` - ✅ Funcional

#### ⚠️ Endpoints que pueden tener cambios internos:
- `/whatsapp-restart/` - Puede necesitar ajustes para whatsapp-web.js
- QR Code generation - Diferentes métodos en whatsapp-web.js

### 3. **Session Status Updates**
Los estados de sesión pueden haber cambiado:

#### Baileys States:
- `CONNECTED`, `CONNECTING`, `DISCONNECTED`, `PAIRING`, `TIMEOUT`

#### WhatsApp-Web.js States:
- `CONNECTED`, `CONNECTING`, `DISCONNECTED`, `LOADING_SCREEN`, `READY`

### 4. **Error Codes Translation**
Mapear códigos de error entre librerías:

#### Frontend i18n Updates Needed:
```javascript
// Posibles nuevos códigos de error en whatsapp-web.js:
"errors": {
  "ERR_WAPP_NOT_INITIALIZED": "WhatsApp no inicializado",
  "ERR_WAPP_CHECK_CONTACT": "Error verificando contacto", 
  "ERR_WAPP_INVALID_CONTACT": "Contacto inválido",
  "ERR_WAPP_DOWNLOAD_MEDIA": "Error descargando media",
  "ERR_SENDING_WAPP_MSG": "Error enviando mensaje",
  "ERR_DELETE_WAPP_MSG": "Error eliminando mensaje",
  "ERR_OTHER_OPEN_TICKET": "Otro ticket abierto"
}
```

## 🔧 Quick Fixes to Apply

### Fix 1: Update Frontend Error Handling
```javascript
// En frontend/src/errors/toastError.js - verificar nuevos códigos
const toastError = (err) => {
  const errorMsg = err.response?.data?.error;
  
  // Nuevos errores de whatsapp-web.js
  if (errorMsg?.includes('ERR_WAPP_')) {
    toast.error(i18n.t(`errors.${errorMsg}`));
    return;
  }
  
  // Error handling existente...
};
```

### Fix 2: Update Session Status Mapping
```javascript
// En components que muestran status de WhatsApp
const getStatusColor = (status) => {
  switch(status) {
    case 'READY': // Nuevo en whatsapp-web.js
    case 'CONNECTED':
      return 'success';
    case 'LOADING_SCREEN': // Nuevo en whatsapp-web.js  
    case 'CONNECTING':
      return 'warning';
    case 'DISCONNECTED':
      return 'error';
    default:
      return 'default';
  }
};
```

### Fix 3: QR Code Display Updates
El QR code generation puede haber cambiado formato.

### Fix 4: Media Handling
WhatsApp-Web.js puede manejar media de forma diferente que Baileys.

## 🚨 Debugging Steps

1. **Check Console Errors**: F12 → Console
2. **Check Network Errors**: F12 → Network  
3. **Check Backend Logs**: Terminal del backend
4. **Test Socket.IO**: Browser console: `socket.connected`
5. **Test API Endpoints**: Browser console API calls

## 📋 Checklist de Verificación

- [ ] Frontend inicia sin errores de consola
- [ ] APIs REST responden correctamente  
- [ ] Socket.IO se conecta y recibe eventos
- [ ] QR Code se genera y muestra
- [ ] Estados de sesión se actualizan
- [ ] Mensajes se envían/reciben
- [ ] Media se procesa correctamente
- [ ] Errores se muestran con i18n correcto