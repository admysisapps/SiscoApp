# Migración de Single-Tenant a Multi-Tenant

## 📋 Resumen

Este documento detalla todos los cambios realizados para migrar la aplicación SiscoApp de una
arquitectura **single-tenant** (una sola base de datos) a **multi-tenant** (múltiples bases de datos
por proyecto).

## 🏗️ Arquitectura Anterior vs Nueva

### Single-Tenant (Antes)

```
┌─────────────────┐
│   SiscoApp      │
│                 │
├─────────────────┤
│   Una sola BD   │
│   "Asmysis"     │
└─────────────────┘
```

### Multi-Tenant (Después)

```
┌─────────────────┐
│   SiscoApp      │
│                 │
├─────────────────┤
│ asmysis_central │ ← Control de usuarios/proyectos
├─────────────────┤
│ proyecto_900111 │ ← BD específica proyecto 1
├─────────────────┤
│ proyecto_900222 │ ← BD específica proyecto 2
└─────────────────┘
```

## 🗄️ Cambios en Base de Datos

### Nueva Base de Datos Central

**`asmysis_central`** - Controla usuarios y proyectos:

```sql
-- Tabla usuarios_sistema
CREATE TABLE usuarios_sistema (
    id INT PRIMARY KEY,
    documento VARCHAR(20),
    proyecto_nit VARCHAR(20),
    rol ENUM('propietario', 'admin'),
    estado ENUM('activo', 'inactivo'),
    fecha_creacion TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

-- Tabla proyectos
CREATE TABLE proyectos (
    nit VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100),
    descripcion TEXT,
    database_name VARCHAR(50),
    database_host VARCHAR(100),
    poderes_habilitados BOOLEAN,
    max_apoderados_propietario INT,
    max_apoderados_admin INT,
    permiso_admin_apoderados BOOLEAN,
    estado ENUM('activo', 'inactivo'),
    created_at TIMESTAMP
);
```

### Bases de Datos por Proyecto

**`proyecto_XXXXXX`** - Una por cada proyecto:

- Contiene datos específicos del proyecto (usuarios, asambleas, apartamentos, etc.)
- Estructura similar a la BD original pero aislada por proyecto

## 🔧 Cambios en el Frontend

### 1. Tipos TypeScript Actualizados

#### `types/User.ts`

```typescript
// ANTES
export interface User {
  usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
}

// DESPUÉS
export interface User {
  usuario?: string; // Legacy
  documento: string; // Nuevo campo principal
  nombre: string;
  apellido: string;
  email: string; // Cambio: correo → email
  telefono: string;
}
```

#### `types/Proyecto.ts`

```typescript
// NUEVO: Campos multi-tenant agregados
export interface Proyecto {
  NIT: string;
  Nombre: string;
  descripcion?: string;
  created_at: string;
  rol_usuario: string;

  // NUEVOS CAMPOS MULTI-TENANT
  database_name: string; // BD específica del proyecto
  database_host: string; // Host de la BD
  poderes_habilitados: boolean;
  max_apoderados_propietario: number;
  max_apoderados_admin: number;
  permiso_admin_apoderados: boolean;
}
```

### 2. Context de Proyectos

#### `contexts/ProjectContext.tsx` - NUEVO

```typescript
// Maneja la selección de proyectos y contexto multi-tenant
interface ProjectContextType {
  selectedProject: Proyecto | null;
  proyectos: Proyecto[];
  isLoadingProjects: boolean;
  setSelectedProject: (project: Proyecto | null) => void;
  switchProject: () => void;
  clearProject: () => void;
}

// Funcionalidades clave:
// 1. Carga proyectos del usuario
// 2. Guarda contexto en AsyncStorage
// 3. Maneja selección automática/manual
```

### 3. Servicios API Actualizados

#### `services/apiService.ts`

```typescript
// NUEVO: Helper para requests con contexto
async makeRequestWithContext(endpoint: string, data: any = {}) {
  const context = await this.getUserContext();
  if (context) {
    data.user_context = context;
  }
  // ... resto de la lógica
}

// ACTUALIZADO: getUserInfo híbrido
async getUserInfo(username: string, useContext: boolean = false) {
  if (useContext) {
    // Modo multi-tenant: usar contexto
    return await this.makeRequestWithContext('/user-info', { username });
  } else {
    // Modo login: sin contexto
    return await fetch(`${BASE_URL}/user-info`, { /* ... */ });
  }
}

// NUEVO: Obtener proyectos del usuario
async getProyectosUsuario(username: string) {
  // Llama lambda /usuario-proyectos
}
```

### 4. Context de Usuario Actualizado

#### `contexts/UserContext.tsx`

```typescript
// ACTUALIZADO: loadUserInfo con logs de debug
const loadUserInfo = async (username: string) => {
  console.log("🔍 USERCONTEXT loadUserInfo: Iniciando para username:", username);
  const response = await apiService.getUserInfo(username);
  // ... manejo de respuesta con logs detallados
};

// CORREGIDO: updateUserInfo con verificación de campos
const updateUserInfo = async (data: Partial<User>) => {
  const userIdentifier = user.documento || user.usuario || "";
  if (!userIdentifier) return false;
  // ... resto de la lógica
};
```

### 5. Componentes Actualizados

#### `app/(screens)/Info_personal.tsx`

```typescript
// NUEVO: Efecto para cargar datos completos
useEffect(() => {
  const loadFullUserData = async () => {
    if (user?.documento && selectedProject && (!user.nombre || !user.apellido)) {
      // Cargar datos completos usando contexto
      const response = await apiService.getUserInfo(user.documento, true);
      if (response.success) {
        setUser(response.data);
      }
    }
  };
  loadFullUserData();
}, [user?.documento, selectedProject, user?.nombre, user?.apellido, setUser]);

// CORREGIDO: Referencias de campos
// user?.usuario → user?.documento || user?.usuario
// user?.correo → user?.email
```

#### `components/ProjectSelector.tsx`

```typescript
// NUEVO: Componente para selección de proyectos
// - Diseño diferente para admin vs usuario regular
// - Muestra información técnica para admins
// - Interfaz simplificada para usuarios
```

## 🔄 Cambios en Lambdas (Backend)

### 1. Lambda `/usuario-proyectos` - NUEVA

```python
def lambda_handler(event, context):
    # Consulta asmysis_central para obtener proyectos del usuario
    # Retorna lista de proyectos con información multi-tenant

    # Query:
    SELECT p.nit, p.nombre, p.database_name, p.database_host,
           us.rol as rol_usuario, p.poderes_habilitados, ...
    FROM usuarios_sistema us
    JOIN proyectos p ON us.proyecto_nit = p.nit
    WHERE us.documento = %s AND us.estado = 'activo'
```

### 2. Lambda `/user-info` - HÍBRIDA

```python
def lambda_handler(event, context):
    user_context = body.get('user_context')  # OPCIONAL

    if user_context:
        # MODO MULTI-TENANT: usar BD específica
        return handle_multitenant_mode(user_context, username)
    else:
        # MODO LOGIN: usar BD central
        return handle_login_mode(username)

def handle_login_mode(username):
    # Consulta asmysis_central.usuarios_sistema
    # Retorna datos básicos para login

def handle_multitenant_mode(user_context, username):
    # 1. Valida acceso en asmysis_central
    # 2. Consulta BD específica del proyecto
    # 3. Retorna datos completos del usuario
```

### 3. Lambdas Existentes Actualizadas

```python
# /asambleas-proyecto, /asamblea, etc.
def lambda_handler(event, context):
    # NUEVO: Extraer contexto del request
    user_context = body.get('user_context')
    if not user_context:
        return error_response(400, 'Contexto requerido')

    # NUEVO: Usar BD específica del contexto
    database_name = user_context.get('database_name')

    # NUEVO: Validar acceso del usuario
    # ... resto de la lógica usando BD específica
```

## 📱 Flujo de Usuario Actualizado

### 1. Login

```
1. Usuario ingresa credenciales
2. Cognito autentica
3. getUserInfo(username, false) → datos básicos desde asmysis_central
4. Usuario autenticado con datos mínimos
```

### 2. Selección de Proyecto

```
1. getProyectosUsuario(documento) → lista de proyectos
2. Si 1 proyecto: selección automática
3. Si múltiples: mostrar ProjectSelector
4. Guardar contexto en AsyncStorage
```

### 3. Uso de la App

```
1. Todas las API calls incluyen user_context
2. Lambdas usan BD específica del proyecto
3. Datos aislados por proyecto
4. Info_personal carga datos completos automáticamente
```

## 🔄 Context Management

### AsyncStorage Structure

```json
{
  "documento": "1070464012",
  "nombre": "Jesús",
  "rol": "propietario",
  "proyecto_nit": "900222222",
  "proyecto_nombre": "Conjunto El Nogal",
  "database_name": "proyecto_900222222",
  "database_host": "",
  "poderes_habilitados": 1,
  "max_apoderados_propietario": 2,
  "max_apoderados_admin": 8,
  "permiso_admin_apoderados": 1
}
```

### Context Flow

```
Login → Proyectos → Selección → Contexto → API Calls
  ↓        ↓         ↓          ↓         ↓
Básico → Lista → AsyncStorage → Headers → BD Específica
```

## 🐛 Problemas Resueltos

### 1. Error TypeScript

```typescript
// PROBLEMA: user.documento puede ser undefined
if (user.documento && ...) {
  await apiService.getProyectosUsuario(user.documento); // ❌ Error TS
}

// SOLUCIÓN: Verificación explícita
const userDoc = user.documento || user.usuario;
if (userDoc && ...) {
  await apiService.getProyectosUsuario(userDoc); // ✅ OK
}
```

### 2. Campo Mapping

```typescript
// PROBLEMA: Inconsistencia de campos
user.usuario vs user.documento
user.correo vs user.email

// SOLUCIÓN: Compatibilidad con fallbacks
{user?.documento || user?.usuario || "No especificado"}
{user?.email || "No especificado"}
```

### 3. Lambda SQL Errors

```sql
-- PROBLEMA: Columnas inexistentes
SELECT nombre, apellido FROM usuarios_sistema; -- ❌ No existen

-- SOLUCIÓN: Solo campos que existen
SELECT documento FROM usuarios_sistema; -- ✅ Existe
```

### 4. ESLint Warnings

```typescript
// PROBLEMA: Missing dependency
useEffect(() => {
  setUser(data); // Usa setUser pero no está en deps
}, [user?.documento]);

// SOLUCIÓN: Agregar dependencia
}, [user?.documento, setUser]);
```

## 📊 Beneficios de la Migración

### ✅ Aislamiento de Datos

- Cada proyecto tiene su propia BD
- No hay contaminación cruzada de datos
- Seguridad mejorada

### ✅ Escalabilidad

- Fácil agregar nuevos proyectos
- BD independientes pueden optimizarse por separado
- Crecimiento horizontal

### ✅ Flexibilidad

- Configuración por proyecto (poderes, límites, etc.)
- Roles específicos por proyecto
- Personalización independiente

### ✅ Mantenimiento

- Backups independientes
- Actualizaciones por proyecto
- Debugging aislado

## 🚀 Estado Final

### ✅ Funcionalidades Completadas

- [x] Login híbrido (con/sin contexto)
- [x] Carga de proyectos multi-tenant
- [x] Selección automática/manual de proyectos
- [x] Context management con AsyncStorage
- [x] API calls con contexto automático
- [x] Datos completos por proyecto
- [x] UI actualizada para multi-tenant
- [x] Lambdas híbridas funcionando
- [x] Sin errores TypeScript/ESLint

### 🎯 Resultado

La aplicación ahora soporta **múltiples proyectos** con **datos completamente aislados**,
manteniendo una **experiencia de usuario fluida** y **arquitectura escalable**.

---

**Migración completada exitosamente** 🎉
