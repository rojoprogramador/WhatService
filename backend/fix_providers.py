#!/usr/bin/env python3
import re

# Leer el archivo
with open('src/services/WbotServices/providers.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Patrón 1: Reemplazar const variable = { formatBody(...) } por const variable = formatBody(...)
pattern1 = r'const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*{\s*(formatBody\([^}]+)\s*};'
content = re.sub(pattern1, r'const \1 = \2;', content, flags=re.MULTILINE | re.DOTALL)

# Patrón 2: Reemplazar líneas sueltas que solo tienen text: formatBody(...)
pattern2 = r'(\s*)text:\s*(formatBody\([^,\}]+)[,\}]'
content = re.sub(pattern2, r'\1\2', content)

# Patrón 3: Reemplazar estructuras multilinea 
pattern3 = r'const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\{\s*\n\s*formatBody\(([^}]+)\),\s*\n\s*\};'
content = re.sub(pattern3, r'const \1 = formatBody(\2);', content, flags=re.MULTILINE | re.DOTALL)

# Patrón 4: Reemplazar cuando la estructura está en una línea
pattern4 = r'const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\{\s*formatBody\(([^}]+)\),?\s*\};'
content = re.sub(pattern4, r'const \1 = formatBody(\2);', content)

# Escribir el archivo corregido
with open('src/services/WbotServices/providers.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Archivo corregido exitosamente")