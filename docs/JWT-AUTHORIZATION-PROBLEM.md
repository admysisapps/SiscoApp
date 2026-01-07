# Problema de Autorización JWT en API Gateway HTTP v2

## 🔍 **Problema Identificado**

### **Configuración Actual:**

- **API Gateway**: HTTP API v2 (no REST API)
- **Autorizador JWT**: Configurado correctamente
- **Cognito**: Funcionando y generando tokens válidos
- **Claims esperados**: `cognito:username` y `email`

### **Síntoma:**

```javascript
// En la lambda, esto llega vacío:
claims = event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {});

console.log(claims); // {} (vacío)
```

## 🔧 **Causa Raíz**

### **API Gateway REST vs HTTP:**

| Característica         | REST API                                        | HTTP API v2         |
| ---------------------- | ----------------------------------------------- | ------------------- |
| **Claims automáticos** | ✅ `event.requestContext.authorizer.jwt.claims` | ❌ No disponible    |
| **Validación JWT**     | ✅ Automática                                   | ✅ Automática       |
| **Acceso a claims**    | Directo                                         | Manual desde header |

### **En HTTP API v2:**

- El autorizador **SÍ valida** el token JWT
- Pero **NO pasa** los claims decodificados al event
- Los claims están en el **header Authorization**

## 📋 **Evidencia del Problema**

### **Log de CloudWatch:**

```json
{
  "headers": {
    "authorization": "Bearer eyJraWQiOiJSaDVEVG52Q1RsdWkrU1I4blpcL1I4QVZFS0c4NXdvVTRCYndNT1RRTkFNdz0iLCJhbGciOiJSUzI1NiJ9..."
  },
  "requestContext": {
    "authorizer": {}, // ❌ Vacío en HTTP API
    "accountId": "473772086356"
  }
}
```

### **Token JWT decodificado contiene:**

```json
{
  "cognito:username": "11223344",
  "email": "jesuspulod8@outlook.es",
  "aud": "5r7v2uvira5sg9q0eol2pvg1eq",
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_fC2m3fU7g"
}
```

## ✅ **Soluciones Propuestas**

### **Opción 1: Decodificación Manual (Recomendada)**

```python
# jwt_utils.py - Función reutilizable
def extract_jwt_claims(event):
    # Intentar claims de API Gateway primero
    claims = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
    if claims:
        return claims

    # Fallback: extraer del header
    auth_header = event.get('headers', {}).get('authorization', '')
    if auth_header.startswith('Bearer '):
        jwt_token = auth_header[7:]
        # Decodificar payload (API Gateway ya validó la firma)
        return decode_jwt_payload(jwt_token)

    return None
```

### **Opción 2: Migrar a REST API**

- Cambiar de HTTP API v2 a REST API
- Los claims llegarían automáticamente
- Requiere reconfiguración completa

### **Opción 3: Enfoque Híbrido (Tu propuesta)**

```python
# Para lambdas críticas (seguridad alta)
documento, email, error = validate_user_from_jwt(event)

# Para lambdas internas (menos críticas)
user_context = body.get('user_context', {})
documento = user_context.get('documento')
```

## 🎯 **Recomendación Final**

### **Estrategia por Tipo de Lambda:**

#### **🔒 Alta Seguridad (JWT obligatorio):**

- `/unirse-nuevo-proyecto`
- `/cambiar-password`
- `/eliminar-cuenta`
- `/admin/*`

```python
from jwt_utils import validate_user_from_jwt

def lambda_handler(event, context):
    documento, email, error = validate_user_from_jwt(event)
    if error:
        return error_response(401, error)
    # Lógica segura...
```

#### **Funcionalidad Normal (user_context):**

- `/obtener-asambleas`
- `/obtener-pagos`
- `/obtener-reservas`

```python
def lambda_handler(event, context):
    body = json.loads(event['body'])
    user_context = body.get('user_context', {})
    documento = user_context.get('documento')
    # Lógica normal...
```

## 🔧 **Implementación**

### **1. Crear utilidad reutilizable:**

```bash
# Crear archivo jwt_utils.py con funciones comunes
# Importar en lambdas que necesiten alta seguridad
```

### **2. Mantener user_context:**

```javascript
// En React Native, seguir enviando user_context para lambdas normales
await apiService.makeRequestWithContextType("/endpoint", data, "FULL");
```

### **3. Configuración por endpoint:**

```python
# Endpoints críticos: JWT
# Endpoints normales: user_context
# Flexibilidad según necesidad
```

## 📈 **Beneficios de esta Estrategia**

✅ **Seguridad escalable** - JWT donde se necesita ✅ **Performance** - user_context donde es
suficiente  
✅ **Mantenibilidad** - Código reutilizable ✅ **Flexibilidad** - Migración gradual ✅
**Compatibilidad** - Funciona con HTTP API v2

## 🚨 **Consideraciones de Seguridad**

### **JWT (Alta Seguridad):**

- Token firmado por Cognito
- Validado por API Gateway
- Imposible de falsificar
- Expira automáticamente

### **user_context (Seguridad Media):**

- Depende de autenticación previa
- Datos pueden ser modificados en tránsito
- Suficiente para operaciones de lectura
- No recomendado para operaciones críticas

## 🔄 **Plan de Migración**

1. **Fase 1**: Implementar jwt_utils.py
2. **Fase 2**: Migrar endpoints críticos a JWT
3. **Fase 3**: Mantener user_context en endpoints normales
4. **Fase 4**: Evaluar migración completa según necesidades
