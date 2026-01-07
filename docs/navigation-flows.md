# Documentación Técnica - Flujos de Navegación SiscoApp

## Arquitectura de Navegación

### Stack Principal

```
RootLayout (app/_layout.tsx)
├── Index (app/index.tsx) - Router principal
├── ProjectSelector (app/project-selector.tsx) - Selección de proyectos
└── TabsLayout (app/(tabs)/_layout.tsx) - Aplicación principal
    ├── Home (app/(tabs)/index.tsx)
    ├── Perfil (app/(tabs)/perfil.tsx)
    └── [Otras tabs...]
```

## Estados de la Aplicación

### Estado de Autenticación

- **Autenticado**: Usuario tiene sesión válida con AWS Amplify
- **No Autenticado**: Usuario debe iniciar sesión

### Estado de Proyecto

- **Con Proyecto**: `selectedProject !== null` en ProjectContext
- **Sin Proyecto**: `selectedProject === null` en ProjectContext

## Flujos de Navegación Detallados

### 1. Flujo de Inicio de Aplicación

```
App Launch → app/index.tsx → ¿selectedProject?
                           ├── Sí → Redirect /(tabs) → TabsLayout
                           └── No → Redirect /project-selector → ProjectSelector
```

**Código de Implementación:**

```tsx
// app/index.tsx
export default function Index() {
  const { selectedProject } = useProject();

  if (selectedProject) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/project-selector" />;
}
```

### 2. Flujo de Selección de Proyecto

```
ProjectSelector → ¿Cantidad de proyectos?
                ├── 0 proyectos → AccessDenied
                ├── 1 proyecto → Auto-selección → setSelectedProject → Redirect /(tabs)
                └── >1 proyectos → Manual Selection → Usuario selecciona → setSelectedProject → Redirect /(tabs)
```

**Estados del Selector:**

- **Loading**: Verificando proyectos del usuario
- **Empty**: Sin proyectos asignados → `<AccessDenied />`
- **Single**: Un proyecto → Auto-selección
- **Multiple**: Múltiples proyectos → Interfaz de selección

### 3. Flujo de Cambio de Proyecto

```
app/(tabs)/perfil.tsx → handleChangeProject() → switchProject() → selectedProject = null
                                            → setTimeout(0ms) → router.replace('/project-selector')
                                            → ProjectSelector → Nueva selección → Redirect /(tabs)
```

**Implementación Técnica:**

```tsx
const handleChangeProject = () => {
  // 1. Limpiar estado
  switchProject();

  // 2. Evitar conflictos de timing
  setTimeout(() => {
    // 3. Navegar fuera del stack de tabs
    router.replace("/project-selector");
  }, 0);
};
```

### 4. Flujo de Navegación en Tabs

```
TabsLayout → Tab Navigation → Home Tab | Perfil Tab | Otras Tabs
                           → Perfil Tab → Cambiar Proyecto → Exit Tabs Stack
```

## Patrones de Navegación Utilizados

### 1. **Redirect Pattern**

```tsx
// Redirección condicional basada en estado
if (condition) {
  return <Redirect href="/target-route" />;
}
```

### 2. **Replace Pattern**

```tsx
// Reemplazar ruta actual sin historial
router.replace("/new-route");
```

### 3. **Timeout Pattern**

```tsx
// Evitar conflictos de setState durante navegación
setTimeout(() => {
  router.replace("/route");
}, 0);
```

## Gestión de Estado Durante Navegación

### ProjectContext

```tsx
interface ProjectContextType {
  selectedProject: Proyecto | null;
  setSelectedProject: (project: Proyecto | null) => void;
  switchProject: () => void; // Limpia selectedProject
}
```

### Estados de Transición

1. **Pre-navegación**: Estado antes del cambio
2. **Transición**: `switchProject()` ejecutado, estado limpio
3. **Post-navegación**: Nuevo estado establecido

## Debugging de Navegación

### Logs de Seguimiento

```tsx
// En cada punto crítico de navegación
console.log("Navigation: [Origen] → [Destino]", {
  selectedProject,
  currentRoute: usePathname(),
});
```

### Estados a Monitorear

- `selectedProject` en ProjectContext
- `pathname` actual con `usePathname()`
- Stack de navegación con `useRootNavigationState()`

## Casos Edge y Manejo de Errores

### 1. **Navegación Interrumpida**

```tsx
// Si switchProject() falla
try {
  switchProject();
} catch (error) {
  console.error("Error clearing project:", error);
  // Fallback navigation
}
```

### 2. **Estado Inconsistente**

```tsx
// Verificación de consistencia
useEffect(() => {
  if (pathname.includes("(tabs)") && !selectedProject) {
    // Estado inconsistente detectado
    router.replace("/project-selector");
  }
}, [pathname, selectedProject]);
```

### 3. **Navegación Circular**

```tsx
// Prevenir loops infinitos
const [navigationCount, setNavigationCount] = useState(0);

useEffect(() => {
  if (navigationCount > 3) {
    console.error("Circular navigation detected");
    // Reset o navegación de emergencia
  }
}, [navigationCount]);
```

## Métricas y Performance

### Tiempo de Navegación

- **Inicio → Tabs**: < 2 segundos
- **Cambio de Proyecto**: < 1 segundo
- **Selección Manual**: Inmediato

### Puntos de Medición

```tsx
const startTime = performance.now();
// ... navegación
const endTime = performance.now();
console.log(`Navigation took ${endTime - startTime}ms`);
```

## Rutas y Paths

### Rutas Principales

- `/` → `app/index.tsx` (Router principal)
- `/project-selector` → `app/project-selector.tsx`
- `/(tabs)` → `app/(tabs)/_layout.tsx`
- `/(tabs)/perfil` → `app/(tabs)/perfil.tsx`

### Patrones de Ruta

- **Absolute**: `/project-selector`
- **Relative**: `../selector` (evitado por complejidad)
- **Group**: `/(tabs)/route`

## Testing de Flujos

### Test Cases Críticos

1. **Inicio sin proyecto** → Debe ir a AccessDenied
2. **Inicio con proyecto** → Debe ir a tabs
3. **Cambio de proyecto** → Debe limpiar estado y navegar
4. **Navegación circular** → Debe prevenirse
5. **Estados inconsistentes** → Debe auto-corregirse

### Mocks Necesarios

```tsx
// Mock ProjectContext
const mockProjectContext = {
  selectedProject: null,
  setSelectedProject: jest.fn(),
  switchProject: jest.fn(),
};
```

## Consideraciones de Seguridad

### Validación de Estado

- Verificar autenticación antes de navegación
- Validar permisos de proyecto
- Sanitizar parámetros de navegación

### Prevención de Ataques

- No exponer rutas sensibles
- Validar origen de navegación
- Implementar rate limiting en cambios de estado

## Troubleshooting Común

### Problema: "Navegación no funciona"

1. Verificar `selectedProject` en context
2. Revisar logs de navegación
3. Confirmar estructura de rutas
4. Validar permisos de usuario

### Problema: "Loop infinito de navegación"

1. Revisar condiciones en `useEffect`
2. Verificar dependencias de hooks
3. Implementar contadores de navegación
4. Agregar breakpoints en flujos críticos

### Problema: "Estado inconsistente"

1. Verificar sincronización de contexts
2. Revisar timing de `setTimeout`
3. Validar limpieza de estado
4. Implementar guards de navegación
