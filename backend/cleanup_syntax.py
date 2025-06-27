#!/usr/bin/env python3
import re

# Leer el archivo
with open('src/services/WbotServices/providers.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Corregir const variable = formatBody(...), ; en const variable = formatBody(...);
content = re.sub(r'(const\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*formatBody\([^;]+),\s*;', r'\1;', content)

# Corregir estructuras que aún tienen { text: ... } no reemplazadas
content = re.sub(r'=\s*{\s*text:\s*(formatBody\([^}]+)\s*}', r'= \1', content)

# Limpiar líneas que quedaron mal formateadas
content = re.sub(r'(\w+)\s*=\s*(formatBody\([^,;]+),\s*;', r'\1 = \2;', content)

# Corregir sendMessage con objetos que aún tienen { text: ... }
content = re.sub(r'sendMessage\(([^,]+),\s*{\s*text:\s*(formatBody\([^}]+)\s*}\)', r'sendMessage(\1, \2)', content)

# Escribir el archivo corregido
with open('src/services/WbotServices/providers.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Limpieza de sintaxis completada exitosamente")