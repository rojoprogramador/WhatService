#!/usr/bin/env python3
import re

# Leer el archivo
with open('src/services/WbotServices/providers.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Patrón 1: Reemplazar wbot.sendMessage(..., { text: formatBody(...) })
# Se convierte a wbot.sendMessage(..., formatBody(...))
pattern1 = r'wbot\.sendMessage\(([^,]+),\s*{\s*text:\s*(formatBody\([^}]+)\s*}\)'
content = re.sub(pattern1, r'wbot.sendMessage(\1, \2)', content, flags=re.MULTILINE)

# Patrón 2: Definiciones de variables como const x = { text: formatBody(...) };
# Se convierte a const x = formatBody(...);
pattern2 = r'const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*{\s*text:\s*(formatBody\([^}]+)\s*};'
content = re.sub(pattern2, r'const \1 = \2;', content, flags=re.MULTILINE)

# Patrón 3: Asignaciones directas como variable = { text: formatBody(...) };
pattern3 = r'([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*{\s*text:\s*(formatBody\([^}]+)\s*};'
content = re.sub(pattern3, r'\1 = \2;', content, flags=re.MULTILINE)

# Escribir el archivo corregido
with open('src/services/WbotServices/providers.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Conversión de mensajes wwebjs completada exitosamente")