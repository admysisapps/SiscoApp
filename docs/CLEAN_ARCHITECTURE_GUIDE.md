# Clean Architecture para React Native - Guía Completa

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [¿Qué es Clean Architecture?](#qué-es-clean-architecture)
3. [Las 4 Capas](#las-4-capas)
4. [Estructura de Carpetas](#estructura-de-carpetas)
5. [Patrones Clave](#patrones-clave)
6. [Implementación Paso a Paso](#implementación-paso-a-paso)
7. [Ejemplos Completos](#ejemplos-completos)
8. [Testing](#testing)
9. [Cuándo Usar y Cuándo NO](#cuándo-usar-y-cuándo-no)
10. [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

Clean Architecture es un patrón de diseño de software que separa el código en capas independientes,
promoviendo:

- **Mantenibilidad**: Código fácil de entender y modificar
- **Escalabilidad**: Crece sin volverse caótico
- **Testabilidad**: Cada capa se puede testear aisladamente
- **Flexibilidad**: Cambiar implementaciones sin afectar lógica de negocio

---

## ¿Qué es Clean Architecture?

### Principio Fundamental: Regla de Dependencia

```
┌─────────────────────────────────────────┐
│       PRESENTATION LAYER                │
│  (UI, Screens, Components, Hooks)       │
└──────────────┬──────────────────────────┘
               ↓ depende de
┌─────────────────────────────────────────┐
│          DOMAIN LAYER                   │
│  (Entities, UseCases, Interfaces)       │
└────────┬─────────────────────┬──────────┘
         ↑ implementa          ↑ usa
┌──────────────────┐  ┌──────────────────┐
│  DATA LAYER      │  │  SHARED LAYER    │
│  (Repositories,  │  │  (API, Storage,  │
│   DTOs, Mappers) │  │   Utils)         │
└──────────────────┘  └──────────────────┘
```

**Regla de Oro**: Las capas internas NO conocen las capas externas.

---

## Las 4 Capas

### 1. Domain Layer (Núcleo del Negocio)

**Responsabilidad**: Define QUÉ hace la aplicación (no CÓMO).

**Contiene**:

- **Models**: Entidades de negocio
- **UseCases**: Lógica de negocio
- **Interfaces**: Contratos (Repositories)
- **Validators**: Reglas de negocio

**Características**:

- Solo TypeScript puro (sin React, sin librerías externas)
- Independiente de frameworks
- Reutilizable entre plataformas
- Fácil de testear

**Ejemplo**:

```typescript
// domain/models/Asamblea.ts
export interface Asamblea {
  id: number;
  titulo: string;
  fecha: Date;
  estado: "programada" | "en_curso" | "finalizada";
}

// domain/repositories/IAsambleaRepository.ts
export interface IAsambleaRepository {
  getAll(): Promise<Asamblea[]>;
  getById(id: number): Promise<Asamblea>;
  create(data: CreateAsambleaDTO): Promise<Asamblea>;
}

// domain/usecases/GetAsambleasUseCase.ts
export class GetAsambleasUseCase {
  constructor(
    private repository: IAsambleaRepository,
    private validator: AsambleaValidator
  ) {}

  async execute(user: User): Promise<Asamblea[]> {
    const asambleas = await this.repository.getAll();
    return this.validator.filterByRole(asambleas, user);
  }
}
```

---

### 2. Data Layer (Transformación de Datos)

**Responsabilidad**: Implementa CÓMO obtener y transformar datos.

**Contiene**:

- **DTOs**: Objetos que coinciden con la API
- **Mappers**: Transforman DTO ↔ Domain
- **Repositories**: Implementaciones de interfaces
- **Services**: Llamadas a APIs

**Características**:

- Implementa interfaces del Domain
- Transforma datos externos a modelos internos
- Maneja cache y persistencia

**Ejemplo**:

```typescript
// data/dto/AsambleaDTO.ts
export interface AsambleaDTO {
  id: number;
  titulo: string;
  fecha_inicio: string; // ← snake_case de API
  estado_asamblea: string;
}

// data/mappers/asambleaMapper.ts
export const asambleaMapper = {
  toDomain(dto: AsambleaDTO): Asamblea {
    return {
      id: dto.id,
      titulo: dto.titulo,
      fecha: new Date(dto.fecha_inicio),
      estado: this.mapEstado(dto.estado_asamblea),
    };
  },

  toDTO(model: Asamblea): AsambleaDTO {
    return {
      id: model.id,
      titulo: model.titulo,
      fecha_inicio: model.fecha.toISOString(),
      estado_asamblea: this.mapEstadoToAPI(model.estado),
    };
  },
};

// data/repositories/AsambleaRepository.ts
export class AsambleaRepository implements IAsambleaRepository {
  constructor(
    private service: AsambleaService,
    private cache: CacheService
  ) {}

  async getAll(): Promise<Asamblea[]> {
    // 1. Intenta cache
    const cached = await this.cache.get("asambleas");
    if (cached) return cached;

    // 2. Llama API
    const response = await this.service.getAll();

    // 3. Transforma DTO → Domain
    const asambleas = response.data.map(asambleaMapper.toDomain);

    // 4. Guarda en cache
    await this.cache.set("asambleas", asambleas);

    return asambleas;
  }
}
```

---

### 3. Presentation Layer (Interfaz de Usuario)

**Responsabilidad**: Muestra datos y captura interacciones del usuario.

**Contiene**:

- **Screens**: Pantallas de la app
- **Components**: Componentes UI reutilizables
- **Hooks**: Lógica de presentación
- **ViewModels**: Datos formateados para UI

**Características**:

- Solo renderiza y captura eventos
- Usa hooks para lógica
- NO contiene lógica de negocio

**Ejemplo**:

```typescript
// presentation/hooks/useAsambleas.ts
export const useAsambleas = () => {
  const { user } = useUser();

  return useQuery({
    queryKey: ['asambleas', user?.rol],
    queryFn: async () => {
      const useCase = new GetAsambleasUseCase(
        asambleaRepository,
        asambleaValidator
      );
      return useCase.execute(user!);
    },
    enabled: !!user,
  });
};

// presentation/screens/AsambleasScreen.tsx
export default function AsambleasScreen() {
  const { data: asambleas, isLoading } = useAsambleas();

  if (isLoading) return <LoadingScreen />;

  return (
    <FlatList
      data={asambleas}
      renderItem={({ item }) => <AsambleaCard asamblea={item} />}
    />
  );
}
```

---

### 4. Shared Layer (Infraestructura Compartida)

**Responsabilidad**: Código compartido entre todas las capas.

**Contiene**:

- **API Client**: Cliente HTTP
- **Storage**: AsyncStorage, SecureStore
- **Contexts**: Estado global (Auth, User)
- **Utils**: Funciones auxiliares
- **UI Kit**: Componentes base

**Ejemplo**:

```typescript
// shared/services/api/apiClient.ts
export const apiClient = {
  async post(endpoint: string, data: any, contextType: string) {
    const token = await this.getAuthToken();
    const context = await this.getUserContext(contextType);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...data, user_context: context }),
    });

    return response.json();
  },
};
```

---

## Estructura de Carpetas

### Opción 1: Feature-Based (Recomendada)

```
src/
├─ features/                    # Organizado por características
│  ├─ asambleas/
│  │  ├─ domain/
│  │  │  ├─ models/
│  │  │  │  └─ Asamblea.ts
│  │  │  ├─ usecases/
│  │  │  │  ├─ GetAsambleasUseCase.ts
│  │  │  │  └─ CreateAsambleaUseCase.ts
│  │  │  ├─ repositories/
│  │  │  │  └─ IAsambleaRepository.ts
│  │  │  └─ validators/
│  │  │     └─ asambleaValidator.ts
│  │  │
│  │  ├─ data/
│  │  │  ├─ dto/
│  │  │  │  └─ AsambleaDTO.ts
│  │  │  ├─ mappers/
│  │  │  │  └─ asambleaMapper.ts
│  │  │  ├─ services/
│  │  │  │  └─ asambleaService.ts
│  │  │  ├─ cache/
│  │  │  │  └─ asambleaCacheService.ts
│  │  │  └─ repositories/
│  │  │     └─ AsambleaRepository.ts
│  │  │
│  │  └─ presentation/
│  │     ├─ admin/
│  │     │  ├─ AsambleasAdminScreen.tsx
│  │     │  ├─ CrearAsambleaScreen.tsx
│  │     │  ├─ hooks/
│  │     │  │  └─ useAsambleasAdmin.ts
│  │     │  └─ components/
│  │     │     └─ AsambleaAdminCard.tsx
│  │     │
│  │     └─ user/
│  │        ├─ AsambleasUserScreen.tsx
│  │        ├─ hooks/
│  │        │  └─ useAsambleasUser.ts
│  │        └─ components/
│  │           └─ AsambleaUserCard.tsx
│  │
│  ├─ pqr/
│  ├─ reservas/
│  └─ avisos/
│
├─ shared/                      # Código compartido
│  ├─ components/               # UI Kit
│  ├─ contexts/                 # Estado global
│  ├─ services/
│  │  ├─ api/
│  │  │  └─ apiClient.ts
│  │  └─ cache/
│  │     └─ cacheService.ts
│  ├─ types/                    # Types compartidos
│  └─ utils/                    # Utilidades
│
└─ app/                         # Expo Router (solo routing)
   ├─ (admin)/
   │  ├─ (asambleas)/
   │  │  ├─ index.tsx           # → features/asambleas/presentation/admin/
   │  │  └─ crear.tsx
   │  └─ _layout.tsx
   │
   ├─ (tabs)/
   │  ├─ (asambleas)/
   │  │  └─ index.tsx           # → features/asambleas/presentation/user/
   │  └─ _layout.tsx
   │
   └─ _layout.tsx
```

**Ventajas**:

- Todo relacionado a una feature está junto
- Fácil de encontrar código
- Fácil de eliminar features completas
- Equipos pueden trabajar en paralelo sin conflictos

---

## Patrones Clave

### 1. Repository Pattern

**Propósito**: Abstraer la fuente de datos.

```typescript
// Domain define QUÉ necesitamos
interface IAsambleaRepository {
  getAll(): Promise<Asamblea[]>;
}

// Data implementa CÓMO lo obtenemos
class AsambleaRepository implements IAsambleaRepository {
  async getAll(): Promise<Asamblea[]> {
    // Puede venir de API, cache, DB local, etc.
    const response = await apiClient.get("/asambleas");
    return response.data.map(asambleaMapper.toDomain);
  }
}

// Tests usan implementación fake
class FakeAsambleaRepository implements IAsambleaRepository {
  async getAll(): Promise<Asamblea[]> {
    return [mockAsamblea1, mockAsamblea2];
  }
}
```

**Beneficios**:

- Cambiar de API REST a GraphQL sin tocar lógica de negocio
- Testear sin llamadas reales a API
- Implementar cache transparentemente

---

### 2. DTO + Mapper Pattern

**Propósito**: Separar contrato externo de modelo interno.

```typescript
// DTO: Coincide con API (snake_case)
interface AsambleaDTO {
  id: number;
  fecha_inicio: string;
  estado_asamblea: "PROGRAMADA" | "EN_CURSO";
}

// Domain: Modelo interno (camelCase)
interface Asamblea {
  id: number;
  fecha: Date;
  estado: "programada" | "en_curso";
}

// Mapper: Transforma entre ambos
const asambleaMapper = {
  toDomain(dto: AsambleaDTO): Asamblea {
    return {
      id: dto.id,
      fecha: new Date(dto.fecha_inicio),
      estado: dto.estado_asamblea.toLowerCase() as any,
    };
  },
};
```

**Beneficios**:

- API cambia, tu código no
- Transformaciones centralizadas
- Type-safe

---

### 3. UseCase Pattern

**Propósito**: Encapsular lógica de negocio específica.

**Cuándo SÍ usar UseCases**:

Usa UseCases cuando la acción tiene reglas de negocio, validaciones o coordinación:

```typescript
// SÍ necesita UseCase: Crear Asamblea (validaciones complejas)
export class CreateAsambleaUseCase {
  constructor(
    private repository: IAsambleaRepository,
    private validator: AsambleaValidator,
    private notificationService: NotificationService
  ) {}

  async execute(data: CreateAsambleaDTO, user: User): Promise<Asamblea> {
    // 1. Validar permisos
    if (!this.validator.canCreate(user)) {
      throw new Error("No tienes permisos");
    }

    // 2. Validar fecha futura
    if (new Date(data.fechaInicio) < new Date()) {
      throw new Error("La fecha debe ser futura");
    }

    // 3. Validar quórum
    if (data.quorumMinimo < 50) {
      throw new Error("Quórum mínimo: 50%");
    }

    // 4. Crear
    const asamblea = await this.repository.create(data);

    // 5. Notificar
    await this.notificationService.notifyNewAsamblea(asamblea);

    return asamblea;
  }
}

// SÍ necesita UseCase: Votar (lógica compleja)
export class VotarUseCase {
  async execute(asambleaId: number, opcion: string, user: User) {
    // Validar asamblea activa
    // Validar que no haya votado
    // Validar derecho a voto
    // Registrar voto
  }
}
```

**Cuándo NO usar UseCases**:

NO uses UseCases para operaciones simples sin lógica de negocio:

```typescript
// NO necesita UseCase: Solo listar datos
// Llamar directamente al repository desde el hook
export const useEdificios = () => {
  return useQuery({
    queryKey: ["edificios"],
    queryFn: () => edificioRepository.getAll(), // Directo
  });
};

// NO necesita UseCase: Solo obtener por ID
export const useAsamblea = (id: number) => {
  return useQuery({
    queryKey: ["asamblea", id],
    queryFn: () => asambleaRepository.getById(id), // Directo
  });
};
```

**Regla práctica**:

- Listar edificios? NO necesita UseCase
- Crear Asamblea con validaciones? SÍ necesita UseCase
- Realizar votación? SÍ necesita UseCase
- Obtener detalles de PQR? NO necesita UseCase
- Aprobar PQR con notificaciones? SÍ necesita UseCase

**Beneficios**:

- Lógica de negocio en un solo lugar
- Fácil de testear
- Reutilizable

---

### 4. Custom Hooks Pattern

**Propósito**: Encapsular lógica de presentación.

```typescript
export const useAsambleas = () => {
  const { user } = useUser();

  return useQuery({
    queryKey: ['asambleas', user?.rol],
    queryFn: async () => {
      const useCase = new GetAsambleasUseCase(
        asambleaRepository,
        asambleaValidator
      );
      return useCase.execute(user!);
    },
  });
};

// Componente solo renderiza
function AsambleasScreen() {
  const { data, isLoading } = useAsambleas();
  return <FlatList data={data} />;
}
```

**Beneficios**:

- Componentes simples
- Lógica reutilizable
- Testeable sin UI

---

## Implementación Paso a Paso

### Paso 1: Definir Domain

```typescript
// 1. Model
export interface Asamblea {
  id: number;
  titulo: string;
  fecha: Date;
  estado: "programada" | "en_curso" | "finalizada";
}

// 2. Repository Interface
export interface IAsambleaRepository {
  getAll(): Promise<Asamblea[]>;
  getById(id: number): Promise<Asamblea>;
  create(data: CreateAsambleaDTO): Promise<Asamblea>;
}

// 3. UseCase
export class GetAsambleasUseCase {
  constructor(private repository: IAsambleaRepository) {}

  async execute(): Promise<Asamblea[]> {
    return this.repository.getAll();
  }
}

// 4. Validator
export const asambleaValidator = {
  canCreate(user: User): boolean {
    return user.rol === "admin";
  },
};
```

### Paso 2: Implementar Data

```typescript
// 1. DTO
export interface AsambleaDTO {
  id: number;
  titulo: string;
  fecha_inicio: string;
}

// 2. Mapper
export const asambleaMapper = {
  toDomain(dto: AsambleaDTO): Asamblea {
    return {
      id: dto.id,
      titulo: dto.titulo,
      fecha: new Date(dto.fecha_inicio),
    };
  },
};

// 3. Service
export const asambleaService = {
  async getAll() {
    return apiClient.post("/asambleas/listar", {}, "GET_ASSEMBLY");
  },
};

// 4. Repository
export class AsambleaRepository implements IAsambleaRepository {
  async getAll(): Promise<Asamblea[]> {
    const response = await asambleaService.getAll();
    return response.data.map(asambleaMapper.toDomain);
  }
}
```

### Paso 3: Crear Presentation

```typescript
// 1. Hook
export const useAsambleas = () => {
  return useQuery({
    queryKey: ['asambleas'],
    queryFn: async () => {
      const useCase = new GetAsambleasUseCase(asambleaRepository);
      return useCase.execute();
    },
  });
};

// 2. Screen
export default function AsambleasScreen() {
  const { data: asambleas, isLoading } = useAsambleas();

  if (isLoading) return <LoadingScreen />;

  return (
    <FlatList
      data={asambleas}
      renderItem={({ item }) => <AsambleaCard asamblea={item} />}
    />
  );
}
```

### Paso 4: Conectar con Expo Router

```typescript
// app/(tabs)/asambleas/index.tsx
import AsambleasScreen from "@/features/asambleas/presentation/user/AsambleasScreen";

export default AsambleasScreen;
```

---

## Ejemplos Completos

Ver archivo: `CLEAN_ARCHITECTURE_EXAMPLES.md`

---

## Testing

### Test por Capa

```typescript
// 1. Test Mapper (sin dependencias)
describe('asambleaMapper', () => {
  it('should map DTO to domain', () => {
    const dto: AsambleaDTO = {
      id: 1,
      titulo: 'Test',
      fecha_inicio: '2024-01-01',
    };

    const result = asambleaMapper.toDomain(dto);

    expect(result.fecha).toBeInstanceOf(Date);
  });
});

// 2. Test Repository (con mock)
jest.mock('@/services/asambleaService');

describe('AsambleaRepository', () => {
  it('should fetch and map asambleas', async () => {
    (asambleaService.getAll as jest.Mock).mockResolvedValue({
      data: [mockAsambleaDTO],
    });

    const result = await asambleaRepository.getAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Object);
  });
});

// 3. Test UseCase (con fake repository)
describe('GetAsambleasUseCase', () => {
  it('should return asambleas', async () => {
    const fakeRepo = {
      getAll: jest.fn().mockResolvedValue([mockAsamblea]),
    };

    const useCase = new GetAsambleasUseCase(fakeRepo);
    const result = await useCase.execute();

    expect(result).toHaveLength(1);
  });
});

// 4. Test Hook (sin UI)
const { result } = renderHook(() => useAsambleas(), {
  wrapper: ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  ),
});

await waitFor(() => {
  expect(result.current.isLoading).toBe(false);
});
```

## Convenciones de Nombres

### Archivos y Carpetas

```typescript
// Carpetas: kebab-case (minúsculas con guiones)
features/
├── asambleas/
├── pqr/
└── reservas-espacios/

// Archivos de componentes: PascalCase
AsambleasScreen.tsx
AsambleaCard.tsx
LoadingScreen.tsx

// Archivos de lógica: camelCase
useAsambleas.ts
asambleaMapper.ts
asambleaService.ts
asambleaValidator.ts

// Archivos de tipos: PascalCase
Asamblea.ts
AsambleaDTO.ts
IAsambleaRepository.ts

// Archivos de configuración: kebab-case
api-client.ts
auth-config.ts
```

### Clases y Tipos

```typescript
// Interfaces de modelos: PascalCase
export interface Asamblea {}
export interface User {}
export interface Reserva {}

// Interfaces de repositorios: I + PascalCase
export interface IAsambleaRepository {}
export interface IUserRepository {}

// DTOs: PascalCase + DTO
export interface AsambleaDTO {}
export interface CreateAsambleaDTO {}
export interface UpdateAsambleaDTO {}

// UseCases: PascalCase + UseCase
export class GetAsambleasUseCase {}
export class CreateAsambleaUseCase {}
export class DeleteAsambleaUseCase {}

// Repositories (implementaciones): PascalCase + Repository
export class AsambleaRepository implements IAsambleaRepository {}
export class UserRepository implements IUserRepository {}

// Componentes React: PascalCase
export function AsambleasScreen() {}
export function AsambleaCard() {}
export const LoadingScreen = () => {};
```

### Variables y Funciones

```typescript
// Variables: camelCase
const asambleas = [];
const isLoading = false;
const selectedProject = null;

// Funciones: camelCase
function getAsambleas() {}
function handlePress() {}
const fetchData = async () => {};

// Constantes globales: UPPER_SNAKE_CASE
const API_BASE_URL = "https://api.example.com";
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 5000;

// Hooks personalizados: use + PascalCase
export const useAsambleas = () => {};
export const useAuth = () => {};
export const useSelectedProject = () => {};

// Event handlers: handle + PascalCase
const handleSubmit = () => {};
const handleAsambleaPress = (id: number) => {};
const handleDeleteConfirm = async () => {};

// Boolean variables: is/has/can + PascalCase
const isLoading = false;
const hasPermission = true;
const canCreate = user?.rol === "admin";
```

### Propiedades de Objetos

```typescript
// Domain Models: camelCase (interno)
export interface Asamblea {
  id: number;
  titulo: string;
  fechaInicio: Date; // camelCase
  estadoAsamblea: string; // camelCase
  numeroParticipantes: number; // camelCase
}

// DTOs: snake_case (coincide con API)
export interface AsambleaDTO {
  id: number;
  titulo: string;
  fecha_inicio: string; // snake_case (API)
  estado_asamblea: string; // snake_case (API)
  numero_participantes: number; // snake_case (API)
}

// Props de componentes: camelCase
interface AsambleaCardProps {
  asamblea: Asamblea;
  onPress: (id: number) => void;
  isSelected: boolean;
  showActions: boolean;
}
```

### Mappers y Servicios

```typescript
// Mappers: camelCase + Mapper
export const asambleaMapper = {
  toDomain(dto: AsambleaDTO): Asamblea {},
  toDTO(model: Asamblea): AsambleaDTO {},
};

export const userMapper = {
  toDomain(dto: UserDTO): User {},
  toDTO(model: User): UserDTO {},
};

// Services: camelCase + Service
export const asambleaService = {
  getAll() {},
  getById(id: number) {},
  create(data: CreateAsambleaDTO) {},
};

export const authService = {
  login(credentials: Credentials) {},
  logout() {},
  refreshToken() {},
};

// Validators: camelCase + Validator
export const asambleaValidator = {
  canCreate(user: User): boolean {},
  canEdit(user: User, asamblea: Asamblea): boolean {},
  isValid(data: CreateAsambleaDTO): boolean {},
};
```

### Enums y Tipos Literales

```typescript
// Enums: PascalCase para nombre, UPPER_SNAKE_CASE para valores
export enum AsambleaEstado {
  PROGRAMADA = "PROGRAMADA",
  EN_CURSO = "EN_CURSO",
  FINALIZADA = "FINALIZADA",
  CANCELADA = "CANCELADA",
}

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
  GUEST = "GUEST",
}

// Tipos literales: lowercase (para domain)
export type AsambleaEstado = "programada" | "en_curso" | "finalizada";
export type UserRole = "admin" | "user" | "guest";
```

### Ejemplos Completos por Capa

#### Domain Layer

```typescript
// domain/models/Asamblea.ts
export interface Asamblea {
  // PascalCase
  id: number; // camelCase
  titulo: string;
  fechaInicio: Date;
  estadoAsamblea: AsambleaEstado;
}

// domain/repositories/IAsambleaRepository.ts
export interface IAsambleaRepository {
  // I + PascalCase
  getAll(): Promise<Asamblea[]>; // camelCase
  getById(id: number): Promise<Asamblea>;
  create(data: CreateAsambleaDTO): Promise<Asamblea>;
}

// domain/usecases/GetAsambleasUseCase.ts
export class GetAsambleasUseCase {
  // PascalCase + UseCase
  constructor(
    private repository: IAsambleaRepository,
    private validator: AsambleaValidator
  ) {}

  async execute(user: User): Promise<Asamblea[]> {
    const asambleas = await this.repository.getAll();
    return this.validator.filterByRole(asambleas, user);
  }
}
```

#### Data Layer

```typescript
// data/dto/AsambleaDTO.ts
export interface AsambleaDTO {
  // PascalCase + DTO
  id: number;
  titulo: string;
  fecha_inicio: string; // snake_case (API)
  estado_asamblea: string;
}

// data/mappers/asambleaMapper.ts
export const asambleaMapper = {
  // camelCase + Mapper
  toDomain(dto: AsambleaDTO): Asamblea {
    return {
      id: dto.id,
      titulo: dto.titulo,
      fechaInicio: new Date(dto.fecha_inicio),
      estadoAsamblea: dto.estado_asamblea as AsambleaEstado,
    };
  },
};

// data/services/asambleaService.ts
export const asambleaService = {
  // camelCase + Service
  async getAll() {
    return apiClient.post("/asambleas/listar", {}, "GET_ASSEMBLY");
  },
};

// data/repositories/AsambleaRepository.ts
export class AsambleaRepository implements IAsambleaRepository {
  async getAll(): Promise<Asamblea[]> {
    const response = await asambleaService.getAll();
    return response.data.map(asambleaMapper.toDomain);
  }
}
```

#### Presentation Layer

```typescript
// presentation/hooks/useAsambleas.ts
export const useAsambleas = () => {      // use + PascalCase
  return useQuery({
    queryKey: ['asambleas'],
    queryFn: async () => {
      const useCase = new GetAsambleasUseCase(asambleaRepository);
      return useCase.execute();
    },
  });
};

// presentation/screens/AsambleasScreen.tsx
export default function AsambleasScreen() {  // PascalCase + Screen
  const { data: asambleas, isLoading } = useAsambleas();

  const handleAsambleaPress = (id: number) => {  // handle + PascalCase
    // ...
  };

  return <FlatList data={asambleas} />;
}

// presentation/components/AsambleaCard.tsx
interface AsambleaCardProps {            // PascalCase + Props
  asamblea: Asamblea;
  onPress: (id: number) => void;
  isSelected: boolean;
}

export function AsambleaCard({           // PascalCase
  asamblea,
  onPress,
  isSelected,
}: AsambleaCardProps) {
  return <TouchableOpacity onPress={() => onPress(asamblea.id)} />;
}
```

### Resumen de Convenciones

| Elemento               | Convención              | Ejemplo                                |
| ---------------------- | ----------------------- | -------------------------------------- |
| Carpetas               | kebab-case              | `asambleas/`, `reservas-espacios/`     |
| Componentes (archivos) | PascalCase              | `AsambleasScreen.tsx`                  |
| Lógica (archivos)      | camelCase               | `useAsambleas.ts`, `asambleaMapper.ts` |
| Interfaces/Tipos       | PascalCase              | `Asamblea`, `User`                     |
| Interfaces Repository  | I + PascalCase          | `IAsambleaRepository`                  |
| DTOs                   | PascalCase + DTO        | `AsambleaDTO`, `CreateAsambleaDTO`     |
| UseCases               | PascalCase + UseCase    | `GetAsambleasUseCase`                  |
| Repositories           | PascalCase + Repository | `AsambleaRepository`                   |
| Variables              | camelCase               | `asambleas`, `isLoading`               |
| Funciones              | camelCase               | `getAsambleas()`, `handlePress()`      |
| Constantes             | UPPER_SNAKE_CASE        | `API_BASE_URL`, `MAX_RETRIES`          |
| Hooks                  | use + PascalCase        | `useAsambleas`, `useAuth`              |
| Event handlers         | handle + PascalCase     | `handleSubmit`, `handlePress`          |
| Booleans               | is/has/can + PascalCase | `isLoading`, `hasPermission`           |
| Props Domain           | camelCase               | `fechaInicio`, `estadoAsamblea`        |
| Props DTO              | snake_case              | `fecha_inicio`, `estado_asamblea`      |
| Enums                  | PascalCase              | `AsambleaEstado`, `UserRole`           |
| Mappers                | camelCase + Mapper      | `asambleaMapper`, `userMapper`         |
| Services               | camelCase + Service     | `asambleaService`, `authService`       |
| Validators             | camelCase + Validator   | `asambleaValidator`                    |

---

## Mejores Prácticas

### 1. Regla de Dependencia

```typescript
//  BIEN
Domain → NO depende de nadie
Data → Depende de Domain
Presentation → Depende de Domain

//  MAL
Domain → Depende de Data (NUNCA)
Domain → Depende de Presentation (NUNCA)
```

### 2. Mantén Domain Puro

```typescript
//  BIEN: Solo TypeScript
export interface Asamblea {
  id: number;
  titulo: string;
}

//  MAL: Dependencias externas
import { View } from "react-native";
export interface Asamblea extends View {}
```

### 3. Un UseCase = Una Responsabilidad

```typescript
//  BIEN
class GetAsambleasUseCase {}
class CreateAsambleaUseCase {}

//  MAL
class AsambleaUseCase {
  getAll() {}
  create() {}
  update() {}
  delete() {}
}
```

### 4. Mappers Centralizados

```typescript
//  BIEN: Un mapper por entidad
const asambleaMapper = {
  toDomain(dto: AsambleaDTO): Asamblea {},
  toDTO(model: Asamblea): AsambleaDTO {},
};

//  MAL: Mapeo inline
const asamblea = {
  id: dto.id,
  titulo: dto.titulo,
  // ... repetido en múltiples lugares
};
```

### 5. Hooks para Lógica de Presentación

```typescript
//  BIEN
const useAsambleas = () => {
  // Lógica aquí
};

function Screen() {
  const { data } = useAsambleas();
  return <View />;
}

//  MAL
function Screen() {
  const [data, setData] = useState([]);
  useEffect(() => {
    // Lógica aquí
  }, []);
  return <View />;
}
```

---

---

## Patrones Avanzados (Opcional)

### Presentation/Container Pattern (MVVM)

Para pantallas complejas, puedes separar la lógica de la UI usando el patrón Presentation/Container:

```typescript
// Container (ViewModel) - Maneja lógica y estado
// features/asambleas/presentation/containers/AsambleasContainer.tsx
export const AsambleasContainer = () => {
  const { data, isLoading, error } = useAsambleas();
  const { user } = useAuth();
  const navigation = useNavigation();

  const handleAsambleaPress = (id: number) => {
    navigation.navigate('AsambleaDetail', { id });
  };

  const handleCreatePress = () => {
    navigation.navigate('CreateAsamblea');
  };

  const canCreate = user?.rol === 'admin';

  return (
    <AsambleasPresentation
      asambleas={data ?? []}
      isLoading={isLoading}
      error={error}
      onAsambleaPress={handleAsambleaPress}
      onCreatePress={handleCreatePress}
      canCreate={canCreate}
    />
  );
};

// Presentation (View) - Solo renderiza
// features/asambleas/presentation/components/AsambleasPresentation.tsx
interface Props {
  asambleas: Asamblea[];
  isLoading: boolean;
  error: Error | null;
  onAsambleaPress: (id: number) => void;
  onCreatePress: () => void;
  canCreate: boolean;
}

export const AsambleasPresentation = ({
  asambleas,
  isLoading,
  error,
  onAsambleaPress,
  onCreatePress,
  canCreate,
}: Props) => {
  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={asambleas}
        renderItem={({ item }) => (
          <AsambleaCard
            asamblea={item}
            onPress={() => onAsambleaPress(item.id)}
          />
        )}
      />
      {canCreate && (
        <FAB icon="plus" onPress={onCreatePress} />
      )}
    </View>
  );
};

// Screen (Entry point)
// app/(tabs)/asambleas/index.tsx
export default AsambleasContainer;
```

**Beneficios**:

- Componentes de presentación 100% testeables sin mocks
- Lógica de navegación centralizada en Container
- UI reutilizable con diferentes lógicas

**Cuándo usar**:

- Pantallas con lógica compleja de navegación
- Múltiples variantes de la misma UI
- Testing exhaustivo de componentes

---

### API Layer vs Repository Layer

Para proyectos grandes, considera separar la capa HTTP de la lógica de datos:

```typescript
// 1. API Layer - Solo HTTP
// shared/api/httpClient.ts
export const httpClient = {
  async post(url: string, data: any, headers: Record<string, string>) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// 2. Repository Layer - Lógica de datos
// features/asambleas/data/repositories/AsambleaRepository.ts
export class AsambleaRepository implements IAsambleaRepository {
  constructor(
    private api: typeof httpClient,
    private tokenService: TokenService,
    private contextService: ContextService,
    private cache: CacheService
  ) {}

  async getAll(): Promise<Asamblea[]> {
    // Intenta cache primero
    const cached = await this.cache.get("asambleas");
    if (cached) return cached;

    // Obtiene token y contexto
    const token = await this.tokenService.getValid();
    const context = await this.contextService.get("GET_ASSEMBLY");

    // Llama API
    const response = await this.api.post("/asambleas/listar", context, {
      Authorization: `Bearer ${token}`,
    });

    // Transforma y cachea
    const asambleas = response.data.map(asambleaMapper.toDomain);
    await this.cache.set("asambleas", asambleas);

    return asambleas;
  }
}
```

**Beneficios**:

- Testear Repository sin llamadas HTTP reales
- Cambiar de fetch a axios sin tocar Repository
- Implementar retry logic y timeout en un solo lugar

---

## Comparación con React Web

Clean Architecture es prácticamente idéntico en React Web y React Native:

### Similitudes (95% igual)

- Domain Layer: 100% compartible
- Data Layer: 100% compartible
- Hooks: 100% compartibles
- UseCases: 100% compartibles
- Repositories: 100% compartibles

### Diferencias (5% diferente)

**React Native:**

```typescript
import { View, FlatList, Text } from 'react-native';

export default function AsambleasScreen() {
  const { data } = useAsambleas();
  return (
    <View>
      <FlatList data={data} renderItem={...} />
    </View>
  );
}
```

**React Web:**

```typescript
export default function AsambleasScreen() {
  const { data } = useAsambleas(); // Mismo hook
  return (
    <div>
      {data?.map(item => (
        <div key={item.id}>{item.titulo}</div>
      ))}
    </div>
  );
}
```

**Conclusión**: Solo cambian los componentes de UI. Domain, Data y Hooks son reutilizables entre Web
y Mobile.

## Recursos Adicionales

- [Clean Architecture: The Concept](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [React Native Architecture Patterns](https://reactnative.dev/docs/architecture-overview)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
