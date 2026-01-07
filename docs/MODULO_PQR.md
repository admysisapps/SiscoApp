# 📋 MÓDULO PQR - DOCUMENTACIÓN COMPLETA

## 📝 DESCRIPCIÓN GENERAL

El **Módulo PQR** (Peticiones, Quejas y Reclamos) permite a los propietarios crear solicitudes y a
los administradores gestionarlas. Incluye sistema de mensajería, cambio de estados, archivos
adjuntos y notificaciones.

### Características Principales:

- ✅ Creación de PQRs con archivos adjuntos
- ✅ Sistema de mensajería en tiempo real
- ✅ Gestión de estados por roles
- ✅ Paginación optimizada
- ✅ Filtros inteligentes
- ✅ Descarga de archivos
- ✅ Notificaciones push

---

## 🏗️ ARQUITECTURA DEL MÓDULO

```
📁 PQR Module
├── 📁 Types/
│   └── Pqr.ts                    # Interfaces y tipos
├── 📁 Services/
│   └── pqrService.ts             # Lógica de negocio
├── 📁 Components/
│   ├── PQRCard.tsx               # Card de PQR
│   └── PQRMainCards.tsx          # Cards principales
├── 📁 Screens/
│   ├── CrearPqrScreen.tsx                # Crear PQR
│   ├── PqrListaScreen.tsx                  # Lista de PQRs
│   └── [id].tsx                  # Detalle de PQR
├── 📁 Hooks/
│   └── useRole.ts                # Hook de roles
└── 📁 Lambda Functions/
    ├── lambda_crear_pqr.py
    ├── lambda_obtener_pqrs.py
    ├── lambda_obtener_pqr_detalle.py
    ├── lambda_enviar_mensaje_pqr.py
    ├── lambda_actualizar_estado_pqr.py
    └── lambda_anular_pqr.py
```

---

## 🔧 TIPOS Y INTERFACES

### **PQR Interface**

```typescript
interface PQR {
  id_pqr: number;
  tipo_peticion: "Petición" | "Queja" | "Reclamo";
  estado_pqr: EstadoPQR;
  asunto: string;
  descripcion: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  documento_creador: string;
  id_apartamento?: number;
  archivo_nombre?: string;
  apartamento?: {
    codigo_apt: string;
    numero: string;
    bloque: string;
  };
  creador?: {
    nombre: string;
    apellido: string;
  };
}
```

### **Estados de PQR**

```typescript
type EstadoPQR =
  | "Pendiente" // Estado inicial
  | "En Proceso" // Admin trabajando
  | "Resuelto" // Completado exitosamente
  | "Cerrado Sin Solución" // No se pudo resolver
  | "Anulado"; // Cancelado por usuario
```

### **Request de Creación**

```typescript
interface CreatePQRRequest {
  tipo_peticion: "Petición" | "Queja" | "Reclamo";
  asunto: string;
  descripcion: string;
  id_apartamento?: number;

  archivo_nombre?: string;
}
```

### **Mensaje Interface**

```typescript
interface Mensaje {
  id: number;
  mensaje: string;
  es_admin: boolean;
  fecha_creacion: string;
  nombre_usuario?: string;
}
```

---

## 🌐 SERVICIOS Y APIS

### **pqrService.ts**

#### **Métodos Principales:**

```typescript
// Obtener PQRs con paginación
obtenerPQRs(pagina: number = 1, limite: number = 10)
// Retorna: { success: boolean, data: PQR[], pagination: PaginationInfo }

// Crear nueva PQR
crearPQR(pqrData: CreatePQRRequest)
// Retorna: { success: boolean, data: PQR, message: string }

// Obtener PQR por ID
obtenerPQRPorId(idPqr: number)
// Retorna: { success: boolean, data: PQR }

// Actualizar estado (solo admin)
actualizarEstadoPQR(idPqr: number, nuevoEstado: EstadoPQR)
// Retorna: { success: boolean, data: PQR, message: string }

// Obtener mensajes
obtenerMensajes(idPqr: number)
// Retorna: { success: boolean, data: Mensaje[] }

// Enviar mensaje
enviarMensaje(idPqr: number, mensaje: string)
// Retorna: { success: boolean, data: Mensaje, message: string }

// Anular PQR (solo propietario)
anularPQR(idPqr: number)
// Retorna: { success: boolean, data: PQR, message: string }
```

#### **Manejo de Errores:**

- **Red**: "Sin conexión a internet"
- **401**: "Sesión expirada"
- **403**: "Sin permisos para..."
- **404**: "PQR no encontrada"
- **400**: "Datos inválidos"
- **500+**: "Error del servidor, inténtalo más tarde"

---

## 🎨 COMPONENTES UI

### **PQRCard.tsx**

**Propósito**: Card individual para mostrar PQR en listas

**Props:**

```typescript
interface PQRCardProps {
  item: PQR;
  onPress: (item: PQR) => void;
}
```

**Características:**

- ✅ Muestra asunto, tipo, fecha, estado
- ✅ Información de apartamento
- ✅ Colores por tipo y estado
- ✅ Optimizado con React.memo

### **PQRMainCards.tsx**

**Propósito**: Cards principales del módulo PQR

**Características:**

- ✅ "Crear nueva PQR" (solo usuarios)
- ✅ "Gestionar PQRs" (admin) / "Mis PQRs" (usuario)
- ✅ Navegación inteligente por rol

---

## 📱 PANTALLAS

### **CrearPqrScreen.tsx - Crear PQR**

**Ruta**: `/(screens)/pqr/create`

**Funcionalidades:**

- ✅ Formulario de creación
- ✅ Selección de tipo (Petición/Queja/Reclamo)
- ✅ Subida de archivos a S3
- ✅ Validación de campos
- ✅ Selección de apartamento

**Estados:**

```typescript
const [formData, setFormData] = useState({
  tipo_peticion: "",
  asunto: "",
  descripcion: "",
  id_apartamento: null,
});
const [archivo, setArchivo] = useState(null);
const [loading, setLoading] = useState(false);
```

### **PqrListaScreen.tsx - Lista de PQRs**

**Ruta**: `/(screens)/pqr/list`

**Funcionalidades:**

- ✅ Lista paginada (10 por página)
- ✅ Filtros por estado
- ✅ Búsqueda local
- ✅ Pull to refresh
- ✅ Carga progresiva

**Filtros Disponibles:**

- **Todos**: Todas las PQRs
- **Pendientes**: Estado "Pendiente"
- **En Proceso**: Estado "En Proceso"
- **Resueltas**: Estado "Resuelto"
- **Cerradas**: "Cerrado Sin Solución" + "Anulado" (solo admin)

### **[id].tsx - Detalle de PQR**

**Ruta**: `/(screens)/pqr/[id]`

**Funcionalidades:**

- ✅ Información completa de PQR
- ✅ Chat de seguimiento
- ✅ Polling automático (30s)
- ✅ Descarga de archivos
- ✅ Cambio de estado (admin)
- ✅ Anular PQR (usuario)

**Estados del Componente:**

```typescript
const [pqr, setPqr] = useState<PQR | null>(null);
const [mensajes, setMensajes] = useState<Mensaje[]>([]);
const [nuevoMensaje, setNuevoMensaje] = useState("");
const [loading, setLoading] = useState(true);
const [enviandoMensaje, setEnviandoMensaje] = useState(false);
```

---

## 🎣 HOOKS PERSONALIZADOS

### **useRole.ts**

**Propósito**: Determinar permisos del usuario

```typescript
export const useRole = () => {
  const { user } = useUser();

  return {
    isAdmin: user?.rol === "admin",
    isUser: user?.rol === "propietario",
    role: user?.rol || "propietario",
  };
};
```

**Uso:**

```typescript
const { isAdmin, isUser } = useRole();

// Mostrar botones según rol
{isAdmin && <AdminButton />}
{isUser && <UserButton />}
```

---

## ⚡ LAMBDAS BACKEND

### **lambda_crear_pqr.py**

**Endpoint**: `/crear-pqr` **Método**: POST

**Funcionalidades:**

- ✅ Validar datos de entrada
- ✅ Crear registro en BD
- ✅ Manejar archivos S3
- ✅ Notificar a admins

### **lambda_obtener_pqrs.py**

**Endpoint**: `/obtener-pqrs` **Método**: POST

**Funcionalidades:**

- ✅ Paginación (10 por página)
- ✅ Filtros por rol (admin ve todas, usuario solo suyas)
- ✅ Ordenamiento por fecha
- ✅ Información de apartamento y creador

### **lambda_obtener_pqr_detalle.py**

**Endpoint**: `/obtener-pqr-detalle` **Método**: POST

**Funcionalidades:**

- ✅ Detalle completo de PQR
- ✅ Información de apartamento
- ✅ Datos del creador
- ✅ Validación de permisos

### **lambda_enviar_mensaje_pqr.py**

**Endpoint**: `/enviar-mensaje-pqr` **Método**: POST

**Funcionalidades:**

- ✅ Crear mensaje de seguimiento
- ✅ Cambio automático a "En Proceso" (admin)
- ✅ Validar estados permitidos
- ✅ Notificaciones push

### **lambda_actualizar_estado_pqr.py**

**Endpoint**: `/actualizar-estado-pqr` **Método**: POST

**Funcionalidades:**

- ✅ Solo admins pueden cambiar estados
- ✅ Validar transiciones permitidas
- ✅ Actualizar fecha_actualizacion
- ✅ Logs de auditoría

### **lambda_anular_pqr.py**

**Endpoint**: `/anular-pqr` **Método**: POST

**Funcionalidades:**

- ✅ Solo propietario puede anular
- ✅ Solo PQRs en estado "Pendiente"
- ✅ Cambio irreversible
- ✅ Notificar a admins

---

## 🗄️ BASE DE DATOS

### **Tabla: pqr**

```sql
CREATE TABLE pqr (
  id_pqr INT PRIMARY KEY AUTO_INCREMENT,
  id_apartamento INT,
  documento_creador VARCHAR(20),
  tipo_peticion ENUM('Petición','Queja','Reclamo'),
  estado_pqr ENUM('Pendiente','En Proceso','Resuelto','Cerrado Sin Solución','Anulado') DEFAULT 'Pendiente',
  asunto VARCHAR(200),
  descripcion TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  archivo_nombre VARCHAR(255),
  FOREIGN KEY (id_apartamento) REFERENCES apartamentos(id),
  FOREIGN KEY (documento_creador) REFERENCES usuarios(documento)
);
```

### **Tabla: pqr_mensajes**

```sql
CREATE TABLE pqr_mensajes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_pqr INT,
  documento_usuario VARCHAR(20),
  mensaje TEXT,
  es_admin BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pqr) REFERENCES pqr(id_pqr),
  FOREIGN KEY (documento_usuario) REFERENCES usuarios(documento)
);
```

### **Índices Recomendados:**

```sql
-- Para consultas por usuario
CREATE INDEX idx_pqr_documento_creador ON pqr(documento_creador);

-- Para consultas por estado
CREATE INDEX idx_pqr_estado ON pqr(estado_pqr);

-- Para ordenamiento por fecha
CREATE INDEX idx_pqr_fecha_creacion ON pqr(fecha_creacion DESC);

-- Para mensajes por PQR
CREATE INDEX idx_mensajes_pqr ON pqr_mensajes(id_pqr);
```

---

## 👥 FLUJOS DE USUARIO

### **Flujo: Crear PQR (Propietario)**

1. Usuario va a PQR → "Crear nueva PQR"
2. Llena formulario (tipo, asunto, descripción)
3. Opcionalmente adjunta archivo
4. Envía PQR → Estado: "Pendiente"
5. Recibe confirmación

### **Flujo: Gestionar PQR (Admin)**

1. Admin va a PQR → "Gestionar PQRs"
2. Ve lista de todas las PQRs
3. Filtra por estado si necesario
4. Entra al detalle de una PQR
5. Responde mensaje → Estado: "En Proceso"
6. Cambia estado a "Resuelto" o "Cerrado Sin Solución"

### **Flujo: Seguimiento (Ambos)**

1. Usuario/Admin entra al detalle
2. Ve historial de mensajes
3. Escribe nuevo mensaje
4. Sistema actualiza en tiempo real (polling 30s)

### **Flujo: Anular PQR (Propietario)**

1. Usuario entra al detalle de su PQR
2. Si está "Pendiente", ve botón "Anular PQR"
3. Confirma acción → Estado: "Anulado"
4. Acción irreversible

---

## 🔄 ESTADOS Y TRANSICIONES

### **Diagrama de Estados:**

```
[Pendiente] ──admin responde──> [En Proceso]
     │                              │
     │                              ├──> [Resuelto]
     │                              └──> [Cerrado Sin Solución]
     │
     └──usuario anula──> [Anulado]
```

### **Transiciones Permitidas:**

| Estado Actual | Puede cambiar a      | Quién puede                     |
| ------------- | -------------------- | ------------------------------- |
| Pendiente     | En Proceso           | Admin (automático al responder) |
| Pendiente     | Anulado              | Propietario                     |
| En Proceso    | Resuelto             | Admin                           |
| En Proceso    | Cerrado Sin Solución | Admin                           |
| En Proceso    | Pendiente            | Admin                           |

### **Estados Finales:**

- ✅ **Resuelto**: PQR completada exitosamente
- ❌ **Cerrado Sin Solución**: No se pudo resolver
- 🚫 **Anulado**: Cancelado por usuario

---

## 🔐 PERMISOS Y ROLES

### **Rol: Propietario**

**Permisos:**

- ✅ Crear PQRs
- ✅ Ver sus propias PQRs
- ✅ Enviar mensajes en sus PQRs
- ✅ Anular PQRs pendientes
- ❌ Ver PQRs de otros
- ❌ Cambiar estados
- ❌ Ver panel de administración

### **Rol: Admin**

**Permisos:**

- ✅ Ver todas las PQRs del proyecto
- ✅ Cambiar estados de PQRs
- ✅ Responder cualquier PQR
- ✅ Gestionar PQRs desde panel admin
- ❌ Crear PQRs (no necesario)
- ❌ Anular PQRs (solo propietario puede)

### **Validaciones de Seguridad:**

```typescript
// En el backend
const esAdmin = await validarAdmin(documento_usuario, proyecto_nit);
const esPropietario = pqr.documento_creador === documento_usuario;

// Cambiar estado: solo admin
if (!esAdmin) {
  return error("Solo administradores pueden cambiar estados");
}

// Anular: solo propietario y estado pendiente
if (!esPropietario || pqr.estado_pqr !== "Pendiente") {
  return error("Solo puedes anular tus PQRs pendientes");
}
```

---

## 📊 MÉTRICAS Y MONITOREO

### **KPIs Importantes:**

- **Tiempo promedio de respuesta** (admin)
- **Tasa de resolución** (resueltas vs cerradas)
- **PQRs por tipo** (petición/queja/reclamo)
- **Satisfacción del usuario** (opcional)

### **Logs de Auditoría:**

```python
logger.info(f"PQR {id_pqr} creada por {documento_usuario}")
logger.info(f"Estado cambiado: {estado_anterior} → {nuevo_estado}")
logger.info(f"Mensaje enviado por {'admin' if es_admin else 'usuario'}")
```

---

## 🚀 OPTIMIZACIONES IMPLEMENTADAS

### **Frontend:**

- ✅ **Paginación**: 10 PQRs por página
- ✅ **Filtros locales**: Sin consultas extra
- ✅ **Polling inteligente**: Solo en estados activos
- ✅ **React.memo**: Componentes optimizados
- ✅ **Lazy loading**: Carga progresiva

### **Backend:**

- ✅ **Índices de BD**: Consultas optimizadas
- ✅ **Paginación**: Límite de 50 por página
- ✅ **Cache**: AsyncStorage para datos frecuentes
- ✅ **Validaciones**: Entrada y permisos
- ✅ **Logs estructurados**: Debugging eficiente

### **UX/UI:**

- ✅ **Estados de carga**: Feedback visual
- ✅ **Errores específicos**: Mensajes útiles
- ✅ **Offline support**: Cache local
- ✅ **Responsive**: Adaptable a pantallas
- ✅ **Accesibilidad**: Labels y contraste

---

## 🔧 CONFIGURACIÓN Y DEPLOYMENT

### **Variables de Entorno:**

```bash
# Lambda Functions
DB_HOST=syscodb.cy34qs8ikrmn.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=Motog8plus.
S3_BUCKET=sisco-pqr-files
```

### **Dependencias Frontend:**

```json
{
  "@expo/vector-icons": "^13.0.0",
  "expo-router": "~3.4.8",
  "react-native-safe-area-context": "4.6.3",
  "@react-native-async-storage/async-storage": "1.18.2"
}
```

### **Dependencias Backend:**

```python
# requirements.txt
pymysql==1.0.2
boto3==1.26.137
```

---

## 📝 NOTAS DE DESARROLLO

### **Convenciones de Código:**

- **Nombres**: camelCase para JS/TS, snake_case para Python/SQL
- **Componentes**: PascalCase con sufijo descriptivo
- **Hooks**: Prefijo "use" + funcionalidad
- **Servicios**: Sufijo "Service"

### **Testing:**

- **Unit Tests**: Servicios y utilidades
- **Integration Tests**: Flujos completos
- **E2E Tests**: Casos de usuario críticos

### **Próximas Mejoras:**

- [ ] Notificaciones push en tiempo real
- [ ] Exportar PQRs a PDF/Excel
- [ ] Dashboard de métricas para admin
- [ ] Sistema de plantillas de respuesta
- [ ] Integración con WhatsApp/Email

---

**📅 Última actualización**: Enero 2025  
**👨‍💻 Desarrollado por**: Equipo SiscoApp  
**📧 Contacto**: dev@siscoapp.com
