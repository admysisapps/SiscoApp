# Pendientes — Roles y Teclado

## Estado actual (rama `dev`)

### ✅ Hecho

- `tenant_structure.sql` — agregado `rol varchar(20) NOT NULL DEFAULT 'propietario'` en tabla
  `usuarios`
- `types/User.ts` — `USER_ROLES` como constante + `UserRol` derivado del tipo
- `components/propietarios/CrearStaffCard.tsx` — nueva tarjeta con ícono `AntDesign usergroup-add`
- `app/(admin)/index.tsx` — `CrearStaffCard` agregada en `AdminPropietariosSection`
- `app/(screens)/propietarios/crear-staff.tsx` — pantalla nueva con form + selector de rol (mock)

---

## BD — Queries para producción

### Tenants existentes (correr en cada tenant)

```sql
ALTER TABLE usuarios
  ADD COLUMN rol varchar(20) NOT NULL DEFAULT 'propietario';
```

### Actualizar admins existentes (reemplazar NIT por cada tenant)

```sql
UPDATE usuarios u
INNER JOIN asmysis_central.usuarios_sistema us
  ON u.documento = us.documento
  AND us.proyecto_nit = '<NIT_DEL_TENANT>'
WHERE us.rol = 'admin'
SET u.rol = 'admin';
```

---

## Pendiente — Roles

### Frontend

- [ ] `hooks/useRole.ts` — agregar `isContador`, `isArrendatario`
- [ ] `hooks/useAppNavigation.ts` — agregar ruta `/(contador)`
- [ ] Crear carpeta `app/(contador)/` con `_layout.tsx` e `index.tsx` básico

### Lambdas

- [ ] `siscoapp_usuarios_crear.py` — agregar `rol` al INSERT en tenant
- [ ] `siscoapp_usuarios_transferir_propiedad.py` — sincronizar `rol` en tenant al reactivar
- [ ] `siscoapp_staff_crear.py` — nueva lambda (transacción dual tenant + central + Cognito)

### Diseño pendiente (para después)

- [ ] `crear-staff.tsx` — flujo GET al entrar: si existe contador mostrar datos, si no mostrar form
- [ ] Arrendatario — `ALTER TABLE apartamentos ADD arrendatario_documento varchar(20) NULL`
- [ ] `siscoapp_arrendatario_asignar.py` — nueva lambda
- [ ] superAdmin + empresas — feature grande, rama separada

---

## Pendiente — Teclado (`react-native-keyboard-controller`)

### Por qué

- `KeyboardAvoidingView` con hack de `behavior` dinámico causa salto visual en iOS
- Afecta múltiples pantallas del proyecto

### Pantallas que usan el hack hoy

- `app/(screens)/avisos/crear-aviso.tsx`
- `app/(admin)/(asambleas)/crearAsamblea.tsx`
- `app/(screens)/propietarios/crear-staff.tsx`
- `app/(auth)/login.tsx`
- `app/(auth)/signup.tsx`
- `app/(screens)/propietarios/crear-usuario.tsx`

### Plan de instalación

1. `npx expo install react-native-keyboard-controller`
2. Envolver app con `KeyboardProvider` en `app/_layout.tsx`
3. Rebuild Android + iOS
4. Reemplazar en cada pantalla:
   - Quitar `KeyboardAvoidingView` + `Platform` + `Keyboard` + hack de listeners
   - Reemplazar `ScrollView` por `KeyboardAwareScrollView`
   - Mover botón submit fuera del scroll (patrón `fixedBottom` de `crear-aviso.tsx`)
5. Probar en ambas plataformas antes de mergear a `main`
