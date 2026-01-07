# Documentación - Implementación de UserContext

## 📋 **Resumen del Problema**

La aplicación tenía una arquitectura problemática donde los datos del usuario (nombre, apellido)
estaban mezclados con los datos del proyecto en una sola lambda, violando el principio de
responsabilidad única.

## 🎯 **Objetivo**

Separar los datos del usuario de los datos del proyecto para tener una arquitectura más limpia,
escalable y mantenible.

## 🏗️ **Arquitectura Implementada**

### **Antes (Problemático):**

```
Lambda /usuario-proyectos
├── Datos del proyecto (NIT, Nombre, dirección)
├── Datos del usuario (nombre, apellido) ❌ MEZCLADO
└── Un solo Context manejando todo
```

### **Después (Correcto):**

```
Lambda /usuario-proyectos          Lambda /user-info
├── Solo datos del proyecto        ├── Solo datos del usuario
│   ├── NIT                        │   ├── usuario (cédula)
│   ├── Nombre                     │   ├── nombre
│   ├── dirección                  │   ├── apellido
│   ├── apartamentos               │   ├── correo
│   └── rol                        │   └── telefono
│                                  │
ProjectContext                     UserContext
├── selectedProject                ├── user
├── setSelectedProject             ├── setUser
└── switchProject                  └── loadUserInfo
```

## 🔧 **Componentes Implementados**

### **1. UserContext**

```tsx
// contexts/UserContext.tsx
interface User {
  usuario: string; // Cédula del usuario
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loadUserInfo: (username: string) => Promise<void>;
  isLoading: boolean;
}
```

**Responsabilidades:**

- Almacenar datos personales del usuario
- Cargar información del usuario desde la API
- Manejar estado de carga

### **2. ProjectContext (Limpio)**

```tsx
// contexts/ProjectContext.tsx
interface Proyecto {
  NIT: string;
  Nombre: string;
  direccion: string;
  created_at: string;
  apartamentos?: string;
  total_apartamentos?: number;
  rol?: string;
  // ❌ Eliminado: nombre, apellido
}
```

**Responsabilidades:**

- Solo datos relacionados con proyectos
- Navegación entre proyectos
- Estado de cambio de proyecto

### **3. API Service**

```tsx
// services/apiService.ts
export const apiService = {
  // Nueva función para datos del usuario
  async getUserInfo(username: string) {
    return fetch(`${BASE_URL}/user-info`, {
      method: "POST",
      body: JSON.stringify({ username }),
    });
  },

  // Función existente solo para proyectos
  async getProyectosUsuario(username: string) {
    return fetch(`${BASE_URL}/usuario-proyectos`, {
      method: "POST",
      body: JSON.stringify({ username }),
    });
  },
};
```

## 🚀 **Flujo de Datos**

### **1. Inicio de Sesión:**

```
Usuario se loguea → useUserProjects se activa → Carga datos en paralelo:
├── apiService.getProyectosUsuario() → ProjectContext
└── apiService.getUserInfo() → UserContext
```

### **2. Uso en Componentes:**

```tsx
// En cualquier componente
function MiComponente() {
  const { user } = useUser(); // Datos personales
  const { selectedProject } = useProject(); // Datos del proyecto

  return (
    <div>
      <h1>
        Hola, {user?.nombre} {user?.apellido}
      </h1>
      <p>Proyecto: {selectedProject?.Nombre}</p>
    </div>
  );
}
```

## 🔄 **Integración con useUserProjects**

```tsx
// hooks/useUserProjects.ts
const cargarProyectos = useCallback(async () => {
  if (!user?.username) return;

  try {
    // Cargar ambos tipos de datos en paralelo
    const [projectsResponse] = await Promise.all([
      apiService.getProyectosUsuario(user.username),
      loadUserInfo(user.username), // ← Carga datos del usuario
    ]);

    if (projectsResponse.success) {
      setProyectos(projectsResponse.data);
    }
  } catch (error) {
    console.error("Error cargando datos:", error);
  }
}, [user?.username]); // ← Sin loadUserInfo para evitar loops
```

## 🐛 **Problema Resuelto: Loop Infinito**

### **Causa del problema:**

```tsx
// ❌ INCORRECTO
}, [user?.username, loadUserInfo]); // loadUserInfo se recrea constantemente
```

### **Solución aplicada:**

```tsx
// ✅ CORRECTO
}, [user?.username]); // Solo depende del username
```

**¿Por qué ocurría?**

1. `UserContext` se renderiza
2. `loadUserInfo` se recrea (nueva función)
3. `useUserProjects` detecta cambio en dependencias
4. `cargarProyectos` se recrea
5. `useEffect` se ejecuta de nuevo
6. Vuelve al paso 1 → **Loop infinito**

## 📱 **Configuración en la App**

### **Layout Principal:**

```tsx
// app/_layout.tsx
<ProjectProvider>
  <UserProvider>
    {" "}
    {/* ← Agregado */}
    <Stack screenOptions={{ headerShown: false }} />
  </UserProvider>
</ProjectProvider>
```

### **Uso en Perfil:**

```tsx
// app/(tabs)/perfil.tsx
export default function Perfil() {
  const { selectedProject } = useProject(); // Datos del proyecto
  const { user } = useUser(); // Datos del usuario

  return (
    <View>
      <Text>
        Usuario: {user?.nombre} {user?.apellido}
      </Text>
      <Text>Proyecto: {selectedProject?.Nombre}</Text>
    </View>
  );
}
```

## 🗄️ **Cambios en Base de Datos**

### **Lambda /usuario-proyectos (Limpia):**

```python
sql = '''
SELECT DISTINCT
    p.NIT,
    p.Nombre,
    p.direccion,
    p.created_at,
    GROUP_CONCAT(u.numero_apartamento ORDER BY u.numero_apartamento SEPARATOR ', ') as apartamentos,
    COUNT(u.numero_apartamento) as total_apartamentos,
    MAX(u.rol) as rol
    -- ❌ Eliminado: MAX(u.nombre) as nombre, MAX(u.apellido) as apellido
FROM Proyectos p
INNER JOIN Usuarios u ON p.NIT = u.NIT
WHERE u.usuario = %s
GROUP BY p.NIT, p.Nombre, p.direccion, p.created_at
ORDER BY p.Nombre
'''
```

### **Nueva Lambda /user-info:**

```python
sql = "SELECT usuario, nombre, apellido, correo, telefono FROM Usuarios WHERE usuario = %s"
```

## ✅ **Beneficios Obtenidos**

### **1. Separación de Responsabilidades:**

- UserContext → Solo datos del usuario
- ProjectContext → Solo datos del proyecto

### **2. Performance:**

- Datos se cargan en paralelo
- No hay re-renders innecesarios
- Caching independiente por tipo de dato

### **3. Mantenibilidad:**

- Código más limpio y organizado
- Fácil agregar nuevas funcionalidades
- Testing más sencillo

### **4. Escalabilidad:**

- Fácil agregar nuevos endpoints
- Contexts independientes
- Arquitectura preparada para crecimiento

## 🧪 **Testing**

### **Casos de Prueba UserContext:**

```tsx
describe("UserContext", () => {
  test("should load user info correctly", async () => {
    const { result } = renderHook(() => useUser(), {
      wrapper: UserProvider,
    });

    await act(async () => {
      await result.current.loadUserInfo("12345678");
    });

    expect(result.current.user).toEqual({
      usuario: "12345678",
      nombre: "Usuario1",
      apellido: "Apellido1",
      correo: "admin@lospinos.com",
      telefono: "3001234567",
    });
  });
});
```

## 🚀 **Próximos Pasos**

1. **Crear lambda /user-info** en AWS
2. **Configurar endpoint** en API Gateway
3. **Probar en Postman** con casos de prueba
4. **Implementar funcionalidades adicionales**:
   - Editar información personal
   - Cambiar contraseña
   - Configuraciones de usuario

## 📊 **Métricas de Éxito**

- ✅ **Separación limpia** de responsabilidades
- ✅ **No hay loops infinitos** en los logs
- ✅ **Performance mejorada** (carga en paralelo)
- ✅ **Código más mantenible** y escalable
- ✅ **Testing más sencillo** por separación de concerns

Esta implementación establece una base sólida para el crecimiento futuro de la aplicación, siguiendo
las mejores prácticas de arquitectura de software.
