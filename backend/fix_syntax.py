#!/usr/bin/env python3
import re

# Leer el archivo
with open('src/services/WbotServices/providers.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Corregir las comas sobrantes después de formatBody que generamos
# Patrón: formatBody(...), seguido de ; en la próxima línea
content = re.sub(r'(formatBody\([^)]+\)),\s*\n\s*;', r'\1;', content)

# Corregir estructuras que aún tienen problemas
# Remover { formatBody(...), } y reemplazar por formatBody(...)
content = re.sub(r'\{\s*(formatBody\([^}]+\)),?\s*\}', r'\1', content)

# Corregir líneas donde quedaron comas solas antes del ;
content = re.sub(r',\s*\n\s*;', ';', content)

# Escribir el archivo corregido
with open('src/services/WbotServices/providers.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Sintaxis corregida exitosamente")