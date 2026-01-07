# Funciones de SiscoApp

## 1. Gestión de Usuarios

### Autenticación y Perfil de Usuario

- **Inicio de sesión personalizado**: Sistema de autenticación propio con UI personalizada (migrado
  desde Amplify UI Authenticator).
- **Login flexible**: Soporte para login con cédula o email.
- **Gestión de perfil**: Los usuarios pueden ver y editar su información personal.
- **Actualización de datos**: Permite modificar nombre, apellido y teléfono del usuario.
- **Recuperación de contraseña**: Sistema completo de recuperación con códigos de verificación.
- **Registro de usuarios**: Proceso de registro con confirmación por email.

### Funciones Principales:

- `login(usernameOrEmail, password)`: Autenticación personalizada con Cognito.
  - **Descripción**: Maneja el login con cédula o email, resolviendo automáticamente la cédula real
    cuando se usa email.
  - **Parámetros**: `usernameOrEmail` - Cédula o email del usuario, `password` - Contraseña.
  - **Retorno**: Objeto con `isSignedIn` y `nextStep`.
  - **Características**: Detección automática de email vs cédula, resolución de alias de Cognito.

- `logout()`: Cierre de sesión con limpieza completa de contextos.
  - **Descripción**: Cierra la sesión en Cognito y limpia todos los estados de la aplicación.
  - **Efecto**: Limpia usuario, proyecto seleccionado y redirige a login.

- `register(username, password, email)`: Registro de nuevos usuarios.
  - **Descripción**: Registra un nuevo usuario en Cognito con cédula como username y email como
    atributo.
  - **Parámetros**: `username` - Cédula del usuario, `password` - Contraseña, `email` - Correo
    electrónico.
  - **Retorno**: Objeto con estado de registro y próximos pasos.

- `confirmRegistration(username, code)`: Confirmación de registro.
  - **Descripción**: Confirma el registro del usuario con el código enviado por email.
  - **Parámetros**: `username` - Cédula del usuario, `code` - Código de confirmación.

- `forgotPasswordSubmit(username)`: Solicitud de recuperación de contraseña.
  - **Descripción**: Inicia el proceso de recuperación de contraseña enviando código por email.
  - **Parámetros**: `username` - Cédula o email del usuario.

- `resetPasswordSubmit(username, code, newPassword)`: Cambio de contraseña con código.
  - **Descripción**: Confirma el cambio de contraseña usando el código de verificación.
  - **Parámetros**: `username` - Cédula del usuario, `code` - Código de verificación,
    `newPassword` - Nueva contraseña.

- `loadUserInfo(username)`: Carga la información del usuario desde el servidor.
  - **Descripción**: Realiza una petición al servidor para obtener los datos completos del usuario.
  - **Parámetros**: `username` - Cédula del usuario.
  - **Retorno**: Promesa que se resuelve cuando los datos del usuario se cargan correctamente.

- `updateUserInfo(data)`: Actualiza la información del usuario en el servidor.
  - **Descripción**: Envía los datos modificados del usuario al servidor para actualizarlos.
  - **Parámetros**: `data` - Objeto con los campos a actualizar (nombre, apellido, teléfono).
  - **Retorno**: Promesa que se resuelve con un booleano indicando éxito o fracaso.

### Funciones Secundarias:

- `setUser(user)`: Actualiza el estado local del usuario.
  - **Descripción**: Establece los datos del usuario en el contexto global de la aplicación.
  - **Parámetros**: `user` - Objeto con los datos completos del usuario o null.

- `clearAuthError()`: Limpia errores de autenticación.
  - **Descripción**: Resetea el estado de errores de autenticación en el contexto.

- `validateUserData(data)`: Valida los datos del usuario antes de enviarlos al servidor.
  - **Descripción**: Comprueba que los campos obligatorios estén presentes y tengan el formato
    correcto.

### Estados Gestionados:

- `user: User | null` - Datos del usuario autenticado
- `isAuthenticated: boolean` - Estado de autenticación
- `isLoading: boolean` - Estado de carga de operaciones
- `authError: AuthError | null` - Errores de autenticación

## 2. Gestión de Proyectos

### Selección y Cambio de Proyecto

- **Selección automática**: Selección automática cuando el usuario tiene un solo proyecto.
- **Selector de proyectos**: Interfaz para elegir entre múltiples proyectos/copropiedades.
- **Cambio de proyecto**: Facilita cambiar entre proyectos sin necesidad de cerrar sesión.
- **Navegación inteligente**: Redirección automática basada en la cantidad de proyectos del usuario.
- **Limpieza de contexto**: Limpieza automática del proyecto seleccionado al hacer logout.

### Funciones Principales:

- `setSelectedProject(project)`: Establece el proyecto actualmente seleccionado.
  - **Descripción**: Actualiza el estado global con el proyecto seleccionado por el usuario.
  - **Parámetros**: `project` - Objeto con la información del proyecto (NIT, nombre, dirección,
    etc.).
  - **Efecto**: Actualiza la interfaz para mostrar la información relacionada con el proyecto
    seleccionado.

- `switchProject()`: Inicia el proceso de cambio de proyecto.
  - **Descripción**: Limpia el proyecto actual y muestra la pantalla de selección de proyectos.
  - **Efecto**: Establece `isChangingProject` a true y limpia el proyecto seleccionado.

- `clearProject()`: Limpia el proyecto seleccionado.
  - **Descripción**: Resetea el proyecto seleccionado y el estado de cambio de proyecto.
  - **Uso**: Llamada automáticamente durante el logout.

- **Selección automática**: Lógica integrada que maneja la selección de proyectos.
  - **1 proyecto**: Selección automática y navegación a tabs.
  - **Múltiples proyectos**: Navegación al selector de proyectos.
  - **Sin proyectos**: Navegación a pantalla de acceso denegado.
  - **Usuario sin acceso**: Navegación a pantalla de acceso denegado.

### Funciones Secundarias:

- `setIsChangingProject(isChanging)`: Controla el estado de cambio de proyecto.
  - **Descripción**: Actualiza un flag que indica si el usuario está en proceso de cambiar de
    proyecto.
  - **Parámetros**: `isChanging` - Booleano que indica si está en proceso de cambio.

- `getProjectDetails(projectId)`: Obtiene detalles adicionales de un proyecto.
  - **Descripción**: Recupera información detallada de un proyecto específico.

### Estados Gestionados:

- `selectedProject: Proyecto | null` - Proyecto actualmente seleccionado
- `isChangingProject: boolean` - Estado de cambio de proyecto

### Efectos Automáticos:

- **Limpieza en logout**: Cuando `isAuthenticated` cambia a `false`, se limpia automáticamente el
  proyecto seleccionado.
- **Selección inteligente**: Cuando el usuario se autentica, se evalúa automáticamente la cantidad
  de proyectos y se toma la acción correspondiente.
- **Navegación automática**: Redirección automática basada en el estado del usuario y proyectos
  disponibles.

## 3. Gestión de Asambleas

### Listado y Visualización

- **Listado de asambleas**: Muestra todas las asambleas asociadas al proyecto seleccionado.
- **Filtrado por estado**: Visualización de asambleas según su estado (programadas, en curso,
  finalizadas, canceladas).
- **Detalles de asamblea**: Muestra información detallada de una asamblea específica.

### Funciones Principales:

- `cargarAsambleas()`: Obtiene la lista de asambleas del proyecto actual.
  - **Descripción**: Realiza una petición al servidor para obtener todas las asambleas asociadas al
    proyecto seleccionado.
  - **Dependencias**: Requiere que haya un proyecto seleccionado en el contexto.
  - **Efecto**: Actualiza el estado con la lista de asambleas y maneja estados de carga y error.

- `cargarAsamblea(id)`: Carga los detalles de una asamblea específica.
  - **Descripción**: Obtiene información detallada de una asamblea particular mediante su ID.
  - **Parámetros**: `id` - Identificador numérico de la asamblea.
  - **Retorno**: Actualiza el estado con los datos de la asamblea solicitada.

### Funciones Secundarias:

- `formatDate(dateString)`: Formatea fechas para mostrarlas en la interfaz.
  - **Descripción**: Convierte strings de fecha a formato localizado (día, mes, año).
  - **Parámetros**: `dateString` - String con la fecha en formato ISO.

- `calcularDiasRestantes(fecha)`: Calcula los días que faltan para una asamblea.
  - **Descripción**: Determina cuántos días faltan para la fecha de la asamblea.
  - **Parámetros**: `fecha` - Fecha de la asamblea.
  - **Retorno**: String descriptivo ("Hoy", "Mañana", "En X días").

- `getEstadoColors(estado)`: Obtiene colores asociados al estado de una asamblea.
  - **Descripción**: Devuelve un objeto con colores y gradientes según el estado.
  - **Parámetros**: `estado` - Estado de la asamblea (programada, en_curso, etc.).
  - **Retorno**: Objeto con colores primarios, gradientes e iconos.

## 4. Gestión de Poderes

### Generación y Administración de Poderes

- **Generación de poder**: Permite a un usuario generar un poder para que otra persona lo represente
  en una asamblea.
- **Formulario de apoderado**: Captura datos del apoderado (nombre, cédula, correo).
- **Persistencia local**: Guarda temporalmente los datos del apoderado en el dispositivo.

### Funciones Principales:

- `generarPoder(asambleaId, data)`: Envía los datos del apoderado al servidor para generar un poder.
  - **Descripción**: Realiza una petición POST al endpoint de generación de poderes.
  - **Parámetros**:
    - `asambleaId` - ID de la asamblea para la que se genera el poder.
    - `data` - Objeto con nombre, cédula y correo del apoderado.
  - **Retorno**: Objeto con indicador de éxito y datos o mensaje de error.

- `handleSave()`: Guarda localmente los datos del apoderado y los envía al servidor.
  - **Descripción**: Valida el formulario, guarda los datos en AsyncStorage y llama a generarPoder.
  - **Efecto**: Muestra alertas de éxito o error y cierra el modal si la operación es exitosa.

### Funciones Secundarias:

- `validateForm()`: Valida los campos del formulario de poder.
  - **Descripción**: Comprueba que los campos obligatorios estén completos y con formato correcto.
  - **Retorno**: Booleano indicando si el formulario es válido.

- `handleClose()`: Maneja el cierre del modal de generación de poder.
  - **Descripción**: Verifica si hay cambios sin guardar y muestra confirmación si es necesario.

- `loadSavedData()`: Carga datos guardados previamente del apoderado.
  - **Descripción**: Recupera datos de AsyncStorage para prellenar el formulario.

- `checkChanges()`: Detecta cambios en el formulario comparando con datos guardados.
  - **Descripción**: Compara los datos actuales con los guardados para habilitar/deshabilitar el
    botón de guardar.

## 5. Visualización de Asambleas según Estado

### Componentes Específicos por Estado

- **Asambleas Programadas**: Muestra información relevante para asambleas futuras.
- **Asambleas En Curso**: Presenta opciones para participar en asambleas activas.
- **Asambleas Finalizadas**: Muestra resultados y actas de asambleas concluidas.
- **Asambleas Canceladas**: Indica motivos de cancelación y posibles reprogramaciones.

### Funciones Principales:

- `renderContenidoSegunEstado()`: Renderiza diferentes componentes según el estado de la asamblea.
  - **Descripción**: Función que determina qué componente mostrar basándose en el estado de la
    asamblea.
  - **Lógica**: Utiliza un switch para seleccionar entre AsambleaProgramada, AsambleaEnCurso,
    AsambleaFinalizada o AsambleaCancelada.
  - **Retorno**: Componente React correspondiente al estado de la asamblea.

### Funciones Secundarias:

- `AsambleaProgramada(asamblea)`: Muestra interfaz para asambleas futuras.
  - **Descripción**: Componente que presenta información relevante para asambleas programadas.
  - **Características**: Muestra tiempo restante, permite generar poderes.

- `AsambleaEnCurso(asamblea)`: Muestra interfaz para asambleas activas.
  - **Descripción**: Componente con opciones para participar en asambleas que están en progreso.
  - **Características**: Muestra enlaces de acceso, estado del quórum.

- `AsambleaFinalizada(asamblea)`: Muestra resultados de asambleas concluidas.
  - **Descripción**: Componente que presenta resultados, decisiones y documentos de asambleas
    finalizadas.

- `AsambleaCancelada(asamblea)`: Muestra información sobre asambleas canceladas.
  - **Descripción**: Componente que indica motivos de cancelación y posibles reprogramaciones.

## 6. Servicios API

### Comunicación con Backend

- **Gestión de usuarios**: Obtención y actualización de datos de usuario.
- **Gestión de proyectos**: Obtención de proyectos asociados a un usuario.
- **Gestión de asambleas**: Obtención de listados y detalles de asambleas.
- **Gestión de poderes**: Envío de datos para generación de poderes.

### Funciones Principales:

- `getUserInfo(username)`: Obtiene información del usuario.
  - **Descripción**: Realiza una petición POST al endpoint `/user-info`.
  - **Parámetros**: `username` - Identificador del usuario.
  - **Retorno**: Objeto con datos del usuario o error.

- `updateUserInfo(username, data)`: Actualiza información del usuario.
  - **Descripción**: Realiza una petición POST al endpoint `/update-user`.
  - **Parámetros**:
    - `username` - Identificador del usuario.
    - `data` - Campos a actualizar.
  - **Retorno**: Objeto con resultado de la operación.

- `getProyectosUsuario(username)`: Obtiene proyectos asociados al usuario.
  - **Descripción**: Realiza una petición POST al endpoint `/usuario-proyectos`.
  - **Parámetros**: `username` - Identificador del usuario.
  - **Retorno**: Lista de proyectos asociados al usuario.

- `getAsambleas(proyectoId)`: Obtiene asambleas de un proyecto.
  - **Descripción**: Realiza una petición POST al endpoint `/asambleas-proyecto`.
  - **Parámetros**: `proyectoId` - Identificador del proyecto (NIT).
  - **Retorno**: Lista de asambleas del proyecto.

- `getAsamblea(asambleaId)`: Obtiene detalles de una asamblea específica.
  - **Descripción**: Realiza una petición POST al endpoint `/asamblea`.
  - **Parámetros**: `asambleaId` - Identificador numérico de la asamblea.
  - **Retorno**: Datos detallados de la asamblea.

- `generarPoder(asambleaId, data)`: Envía datos para generar un poder.
  - **Descripción**: Realiza una petición POST al endpoint `/generar-poder`.
  - **Parámetros**:
    - `asambleaId` - ID de la asamblea.
    - `data` - Datos del apoderado (nombre, cédula, correo).
  - **Retorno**: Confirmación de generación del poder.

### Funciones Secundarias:

- `handleApiError(error)`: Procesa errores de API de forma consistente.
  - **Descripción**: Formatea y registra errores de las llamadas a la API.

- `getAuthHeaders()`: Obtiene cabeceras de autenticación para peticiones.
  - **Descripción**: Prepara los headers necesarios para autenticar peticiones a la API.

- `parseApiResponse(response)`: Procesa respuestas de la API de forma estándar.
  - **Descripción**: Extrae datos y verifica el estado de éxito de las respuestas.

## 7. Interfaz de Usuario

### Componentes Reutilizables

- **Modales**: Para edición de información y generación de poderes.
- **Tarjetas**: Para visualización de asambleas y detalles.
- **Indicadores de estado**: Muestran visualmente el estado de las asambleas.
- **Formularios**: Para captura de datos con validación.

### Componentes Principales:

- `EditPersonalInfoModal`: Modal para editar información personal del usuario.
  - **Descripción**: Permite al usuario modificar su nombre, apellido y teléfono.
  - **Funcionalidades**: Validación de campos, detección de cambios, confirmación antes de
    descartar.

- `GenerarPoderModal`: Modal para generar poderes de representación.
  - **Descripción**: Formulario para ingresar datos del apoderado.
  - **Funcionalidades**: Validación de campos, persistencia local de datos, envío al servidor.

- `AsambleaCard`: Tarjeta para mostrar información resumida de una asamblea.
  - **Descripción**: Muestra estado, fecha, hora y tipo de asamblea.
  - **Funcionalidades**: Indicadores visuales según estado, navegación a detalles.

- `AsambleaDetalleHeader`: Encabezado para la vista detallada de una asamblea.
  - **Descripción**: Muestra información principal y estado visual de la asamblea.
  - **Funcionalidades**: Gradientes e iconos según estado, información de quórum.

- `LoadingOverlay`: Indicador de carga para operaciones asíncronas.
  - **Descripción**: Overlay semitransparente con animación de carga.

### Características de UI:

- **Diseño responsivo**: Adaptación a diferentes tamaños de pantalla.
- **Feedback visual**: Indicadores de éxito, error y estados intermedios.
- **Validación en tiempo real**: Comprobación inmediata de campos en formularios.
- **Indicadores de estado**: Colores e iconos que reflejan el estado de las asambleas.
- **Accesibilidad**: Contraste adecuado, tamaños de texto legibles.

## 8. Almacenamiento Local

### Persistencia de Datos

- **AsyncStorage**: Almacenamiento de datos del apoderado para recuperación posterior.
- **Gestión de estado**: Mantenimiento del estado de la aplicación entre sesiones.

### Funciones Principales:

- `AsyncStorage.setItem(key, value)`: Guarda datos localmente.
  - **Descripción**: Almacena datos en el dispositivo de forma persistente.
  - **Parámetros**:
    - `key` - Clave única para identificar los datos (ej: `apoderado_${asambleaId}`).
    - `value` - String con los datos a guardar (generalmente JSON stringificado).
  - **Retorno**: Promesa que se resuelve cuando los datos se guardan correctamente.

- `AsyncStorage.getItem(key)`: Recupera datos guardados localmente.
  - **Descripción**: Obtiene datos previamente almacenados en el dispositivo.
  - **Parámetros**: `key` - Clave con la que se guardaron los datos.
  - **Retorno**: Promesa que se resuelve con el valor guardado o null si no existe.

### Funciones Secundarias:

- `AsyncStorage.removeItem(key)`: Elimina datos guardados.
  - **Descripción**: Borra datos específicos del almacenamiento local.
  - **Parámetros**: `key` - Clave de los datos a eliminar.

- `AsyncStorage.clear()`: Limpia todo el almacenamiento.
  - **Descripción**: Elimina todos los datos guardados en AsyncStorage.

- `AsyncStorage.multiGet(keys)`: Recupera múltiples valores.
  - **Descripción**: Obtiene varios valores almacenados en una sola operación.
  - **Parámetros**: `keys` - Array de claves a recuperar.

- `AsyncStorage.multiSet(keyValuePairs)`: Guarda múltiples valores.
  - **Descripción**: Almacena varios pares clave-valor en una sola operación.
  - **Parámetros**: `keyValuePairs` - Array de pares [clave, valor].

## 9. Navegación

### Sistema de Rutas

- **Navegación por pestañas**: Acceso rápido a secciones principales.
- **Navegación anidada**: Para detalles y subsecciones.
- **Navegación dinámica**: Basada en parámetros como IDs de asambleas.
- **Navegación inteligente**: Sistema que redirige automáticamente basado en el estado de
  autenticación y proyectos.
- **Protección de rutas**: Verificación de autenticación y acceso antes de mostrar contenido.

### Flujo de Navegación Automática:

1. **App Start** → `Index`
2. **No autenticado** → `Login`
3. **Autenticado sin datos** → `AccessDenied`
4. **Autenticado con 1 proyecto** → Selección automática → `Tabs`
5. **Autenticado con múltiples proyectos** → `ProjectSelector` → `Tabs`
6. **Autenticado sin proyectos** → `AccessDenied`

### Funciones Principales:

- `router.push(route)`: Navega a una ruta específica.
  - **Descripción**: Dirige al usuario a una nueva pantalla en la aplicación.
  - **Parámetros**: `route` - String con la ruta de destino (ej: `/(tabs)/(asambleas)/${id}`).
  - **Ejemplo**: `router.push('/(tabs)/(asambleas)/123')`

- `router.replace(route)`: Reemplaza la ruta actual.
  - **Descripción**: Navega a una nueva ruta reemplazando la actual en el historial.
  - **Uso**: Navegación automática donde no se debe permitir regresar.
  - **Ejemplo**: `router.replace('/(auth)/login')`

- `router.back()`: Regresa a la pantalla anterior.
  - **Descripción**: Navega hacia atrás en el historial de navegación.
  - **Uso común**: Botón de retorno en encabezados.

- `useLocalSearchParams()`: Obtiene parámetros de la URL actual.
  - **Descripción**: Hook que extrae parámetros dinámicos de la ruta actual.
  - **Ejemplo**: `const { id } = useLocalSearchParams<{ id: string }>();`

- **Navegación condicional en Index**: Lógica centralizada de navegación.
  - **Descripción**: El componente `Index` evalúa el estado de autenticación y proyectos para
    determinar la navegación.
  - **Características**: Incluye mecanismo `forceRender` para asegurar re-renders correctos.

### Funciones Secundarias:

- `Link`: Componente para navegación declarativa.
  - **Descripción**: Crea enlaces navegables sin necesidad de handlers.
  - **Ejemplo**: `<Link href="/(tabs)/perfil">Mi Perfil</Link>`

- `Tabs`: Configuración de navegación por pestañas.
  - **Descripción**: Define la estructura de navegación por pestañas en la aplicación.

- `Stack`: Configuración de navegación en pila.
  - **Descripción**: Define la estructura de navegación jerárquica.

### Características de Navegación:

- **Rutas dinámicas**: Soporte para parámetros en rutas (ej: `[id].tsx`).
- **Preservación de estado**: Mantiene el estado al navegar entre pantallas.
- **Transiciones fluidas**: Animaciones suaves entre pantallas.
- **Navegación anidada**: Combinación de tabs, stacks y pantallas individuales.
- **Protección de rutas**: Verificación automática de autenticación en rutas protegidas.
- **Navegación reactiva**: Re-evaluación automática de rutas cuando cambian los estados de
  autenticación.
- **Limpieza de historial**: Uso de `replace` para evitar navegación hacia atrás en flujos de
  autenticación.

## 10. Gestión de Estado Global

### Contextos de React

- **UserContext**: Mantiene el estado del usuario actual.
- **ProjectContext**: Gestiona el proyecto seleccionado.
- **AsambleaContext**: Administra el estado de las asambleas.
- **LoadingContext**: Controla estados de carga globales.

### Funciones Principales:

- `UserProvider({ children })`: Proveedor de contexto para datos del usuario.
  - **Descripción**: Componente que proporciona acceso al estado del usuario en toda la aplicación.
  - **Estado gestionado**: Usuario actual, estado de carga.
  - **Funciones expuestas**: loadUserInfo, updateUserInfo, setUser.

- `ProjectProvider({ children })`: Proveedor de contexto para proyectos.
  - **Descripción**: Gestiona el proyecto seleccionado actualmente.
  - **Estado gestionado**: Proyecto seleccionado, estado de cambio de proyecto.
  - **Funciones expuestas**: setSelectedProject, switchProject, setIsChangingProject.

- `AsambleaProvider({ children })`: Proveedor de contexto para asambleas.
  - **Descripción**: Gestiona el estado de las asambleas del proyecto actual.
  - **Estado gestionado**: Lista de asambleas, estados de carga y error.
  - **Funciones expuestas**: cargarAsambleas.

- `LoadingProvider({ children })`: Proveedor de contexto para estados de carga globales.
  - **Descripción**: Gestiona indicadores de carga a nivel de aplicación.
  - **Estado gestionado**: Estado de carga global, mensajes de carga.

### Hooks Personalizados:

- `useUser()`: Accede al contexto de usuario.
  - **Descripción**: Hook que proporciona acceso al estado y funciones del usuario.
  - **Retorno**: { user, setUser, loadUserInfo, updateUserInfo, isLoading, isAuthenticated,
    authError, login, logout, register, confirmRegistration, forgotPasswordSubmit,
    resetPasswordSubmit, clearAuthError }

- `useProject()`: Accede al contexto de proyecto.
  - **Descripción**: Hook que proporciona acceso al proyecto seleccionado.
  - **Retorno**: { selectedProject, setSelectedProject, switchProject, clearProject,
    isChangingProject, setIsChangingProject }

- `useAsambleas()`: Accede al contexto de asambleas.
  - **Descripción**: Hook que proporciona acceso a las asambleas y funciones relacionadas.
  - **Retorno**: { asambleas, cargando, error, cargarAsambleas }

- `useLoading()`: Accede al contexto de carga global.
  - **Descripción**: Hook que proporciona control sobre indicadores de carga globales.
  - **Retorno**: { isLoading, setIsLoading, loadingMessage, setLoadingMessage }
