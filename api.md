# API SERVICES - SISCOAPP

## ESTRUCTURA DEL USER CONTEXT (ACTUALIZADO)

```json
{
  "user_context": {
    "documento": "67890123",
    "nombre": "Juan Pérez",
    "email": "juan@email.com",
    "rol": "propietario",
    "proyecto_nit": "900111111",
    "proyecto_nombre": "Conjunto Los Pinos",
    "copropiedad": "proyecto_900111111",
    "poderes_habilitados": 1,
    "max_apoderados_propietario": 3,
    "max_apoderados_admin": 2,
    "permiso_admin_apoderados": 1,
    "apartamento_codigo": "A101"
  }
}
```

**Nota:** `copropiedad` reemplaza a `database_name` y `database_host`

---

## SERVICIOS DE AUTENTICACIÓN Y USUARIO

### 1. Obtener Información de Usuario (Login)

**Endpoint:** `POST /user-info`  
**Context Type:** `NONE`

**Solicitud:**

```json
{
  "username": "67890123"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "documento": "67890123",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@email.com",
    "telefono": "3001234567"
  },
  "mode": "login"
}
```

---

### 2. Actualizar Información de Usuario

**Endpoint:** `POST /update-user`  
**Context Type:** `USER_UPDATE` - `["documento", "proyecto_nit", "copropiedad"]`

**Solicitud:**

```json
{
  "username": "67890123",
  "nombre": "Juan Carlos",
  "telefono": "3009876543",
  "user_context": {
    "documento": "67890123",
    "proyecto_nit": "900111111",
    "copropiedad": "proyecto_900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "data": {
    "documento": "67890123",
    "nombre": "Juan Carlos",
    "telefono": "3009876543"
  }
}
```

---

### 3. Obtener Apartamentos del Usuario

**Endpoint:** `POST /apartamentos-usuario`  
**Context Type:** `APARTMENTS` - `["documento", "copropiedad"]`  
**Restricción:** Solo propietarios

**Solicitud:**

```json
{
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codigo_apt": "A101",
      "numero": "101",
      "bloque": "A",
      "coeficiente": 0.025
    }
  ],
  "total": 1,
  "usuario": "67890123"
}
```

---

## SERVICIOS DE GESTIÓN DE PROYECTOS

### 4. Obtener Proyectos del Usuario

**Endpoint:** `POST /usuario-proyectos`  
**Context Type:** `PROJECTS_NONE` - Sin contexto

**Solicitud:**

```json
{
  "username": "67890123"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "NIT": "900111111",
      "Nombre": "Conjunto Los Pinos",
      "copropiedad": "proyecto_900111111",
      "rol_usuario": "propietario",
      "poderes_habilitados": 1,
      "max_apoderados_propietario": 3,
      "max_apoderados_admin": 2,
      "permiso_admin_apoderados": 1
    }
  ],
  "total": 1,
  "usuario": "67890123"
}
```

---

## SERVICIOS DE PQR (PETICIONES, QUEJAS Y RECLAMOS)

### 5. Listar PQRs con Paginación

**Endpoint:** `POST /obtener-pqrs`  
**Context Type:** `PQR_LIST` -
`["documento", "rol", "apartamento_codigo", "proyecto_nit", "copropiedad"]`

**Solicitud:**

```json
{
  "pagina": 1,
  "limite": 10,
  "user_context": {
    "documento": "67890123",
    "rol": "propietario",
    "apartamento_codigo": "A101",
    "proyecto_nit": "900111111",
    "copropiedad": "proyecto_900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "pqrs": [
    {
      "id_pqr": 1,
      "tipo_peticion": "Queja",
      "estado_pqr": "Pendiente",
      "asunto": "Ruido en las noches",
      "descripcion": "Hay mucho ruido...",
      "fecha_creacion": "2025-01-15T10:30:00",
      "apartamento": {
        "codigo_apt": "A101",
        "numero": "101",
        "bloque": "A"
      },
      "creador": {
        "nombre": "Juan",
        "apellido": "Pérez"
      }
    }
  ],
  "pagina_actual": 1,
  "total_paginas": 3,
  "total_registros": 25
}
```

---

### 6. Crear Nueva PQR

**Endpoint:** `POST /crear-pqr`  
**Context Type:** `PQR_CREATE` -
`["documento", "apartamento_codigo", "proyecto_nit", "rol", "copropiedad"]`  
**Restricción:** Solo propietarios

**Solicitud:**

```json
{
  "tipo_peticion": "Queja",
  "asunto": "Problema con ascensor",
  "descripcion": "El ascensor no funciona desde ayer",
  "archivo_s3_key": "opcional-archivo-key",
  "archivo_nombre": "opcional-foto.jpg",
  "user_context": {
    "documento": "67890123",
    "apartamento_codigo": "A101",
    "proyecto_nit": "900111111",
    "rol": "propietario",
    "copropiedad": "proyecto_900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "pqr": {
    "id_pqr": 15,
    "tipo_peticion": "Queja",
    "estado_pqr": "Pendiente",
    "asunto": "Problema con ascensor",
    "fecha_creacion": "2025-01-15T14:20:00"
  },
  "message": "PQR creada exitosamente"
}
```

---

### 7. Obtener Detalle de PQR

**Endpoint:** `POST /obtener-pqr-detalle`  
**Context Type:** `PQR_DETAIL` -
`["documento", "rol", "apartamento_codigo", "proyecto_nit", "copropiedad"]`

**Solicitud:**

```json
{
  "id_pqr": 15,
  "user_context": {
    "documento": "67890123",
    "rol": "propietario",
    "apartamento_codigo": "A101",
    "proyecto_nit": "900111111",
    "copropiedad": "proyecto_900111111"
  }
}
```

---

### 8. Actualizar Estado de PQR

**Endpoint:** `POST /actualizar-estado-pqr`  
**Context Type:** `PQR_ADMIN` - `["documento", "rol", "proyecto_nit", "copropiedad"]`  
**Restricción:** Solo administradores

---

### 9. Obtener Mensajes de Seguimiento

**Endpoint:** `POST /obtener-mensajes-pqr`  
**Context Type:** `PQR_MESSAGES` -
`["documento", "rol", "apartamento_codigo", "proyecto_nit", "copropiedad"]`

---

### 10. Enviar Mensaje de Seguimiento

**Endpoint:** `POST /enviar-mensaje-pqr`  
**Context Type:** `PQR_MESSAGES`

---

### 11. Anular PQR

**Endpoint:** `POST /anular-pqr`  
**Context Type:** `PQR_DETAIL`  
**Restricción:** Solo el creador

---

## SERVICIOS DE AVISOS/COMUNICADOS

### 12. Crear Aviso

**Endpoint:** `POST /crear-aviso`  
**Context Type:** `PROPIETARIOS_ADMIN_TRANSFER` -
`["copropiedad", "documento", "rol", "proyecto_nit"]`  
**Restricción:** Solo administradores

**Solicitud:**

```json
{
  "titulo": "Mantenimiento programado",
  "contenido": "Se realizará mantenimiento el próximo sábado",
  "user_context": {
    "copropiedad": "proyecto_900111111",
    "documento": "12345678",
    "rol": "admin",
    "proyecto_nit": "900111111"
  }
}
```

---

### 13. Obtener Avisos

**Endpoint:** `POST /obtener-avisos`  
**Context Type:** `AVISOS` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "pagina": 1,
  "limite": 15,
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

---

## SERVICIOS DE PUBLICACIONES

### 14. Crear Publicación

**Endpoint:** `POST /crear-publicacion`  
**Context Type:** `PUBLICACIONES_CREATE` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "tipo": "Venta",
  "titulo": "Vendo muebles",
  "descripcion": "Muebles en buen estado",
  "precio": 500000,
  "imagenes": ["imagen1.jpg", "imagen2.jpg"],
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

---

### 15. Listar Publicaciones

**Endpoint:** `POST /listar-publicaciones`  
**Context Type:** `PUBLICACIONES_LIST` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "pagina": 1,
  "limite": 12,
  "filtros": {
    "tipo": "Venta",
    "estado": "Activa"
  },
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

---

### 16. Cambiar Estado de Publicación

**Endpoint:** `POST /cambiar-estado-publicacion`  
**Context Type:** `PUBLICACIONES_UPDATE_STATE` - `["documento", "copropiedad", "proyecto_nit"]`

**Solicitud:**

```json
{
  "publicacion_id": 5,
  "nuevo_estado": "Pausada",
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111",
    "proyecto_nit": "900111111"
  }
}
```

---

### 17. Bloquear Publicación (Admin)

**Endpoint:** `POST /bloquear-publicacion`  
**Context Type:** `PUBLICACIONES_UPDATE_STATE_ADMIN` -
`["documento", "copropiedad", "proyecto_nit", "rol"]`  
**Restricción:** Solo administradores

---

## SERVICIOS DE RESERVAS

### 18. Crear Espacio Común

**Endpoint:** `POST /crear-zona-comun`  
**Context Type:** `SPACES_ADMIN_CREATE` - `["documento", "rol", "copropiedad"]`  
**Restricción:** Solo administradores

**Solicitud:**

```json
{
  "nombre": "Salón Social",
  "descripcion": "Salón para eventos",
  "capacidad": 50,
  "precio_hora": 50000,
  "horario_apertura": "08:00",
  "horario_cierre": "22:00",
  "user_context": {
    "documento": "12345678",
    "rol": "admin",
    "copropiedad": "proyecto_900111111"
  }
}
```

---

### 19. Listar Espacios Comunes

**Endpoint:** `POST /obtener-zonas-comunes`  
**Context Type:** `SPACES_LIST` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "solo_activos": true,
  "incluir_horarios": false,
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

---

### 20. Obtener Detalle de Espacio

**Endpoint:** `POST /detalle-zona`  
**Context Type:** `SPACES_DETAIL` - `["documento", "copropiedad"]`

---

### 21. Editar Espacio Común

**Endpoint:** `POST /editar-zona-comun`  
**Context Type:** `SPACES_ADMIN_EDIT` - `["documento", "rol", "copropiedad"]`  
**Restricción:** Solo administradores

---

### 22. Validar Disponibilidad

**Endpoint:** `POST /obtener-horarios-minutos`  
**Context Type:** `RESERVATIONS_VALIDATE` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "espacio_id": 1,
  "fecha_reserva": "2025-01-20",
  "hora_inicio": "14:00",
  "hora_fin": "18:00",
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

---

### 23. Obtener Horarios del Día

**Endpoint:** `POST /obtener-horarios-hora`  
**Context Type:** `RESERVATIONS_VALIDATE`

---

### 24. Crear Reserva

**Endpoint:** `POST /crear-reserva`  
**Context Type:** `RESERVAS_CREATE` - `["documento", "rol", "copropiedad", "apartamento_codigo"]`

**Solicitud:**

```json
{
  "espacio_id": 1,
  "fecha_reserva": "2025-01-20",
  "hora_inicio": "14:00",
  "hora_fin": "18:00",
  "precio_total": 200000,
  "motivo": "Cumpleaños",
  "user_context": {
    "documento": "67890123",
    "rol": "propietario",
    "copropiedad": "proyecto_900111111",
    "apartamento_codigo": "A101"
  }
}
```

---

### 25. Listar Reservas

**Endpoint:** `POST /listar-reservas`  
**Context Type:** `RESERVAS_LIST` - `["documento", "rol", "copropiedad", "apartamento_codigo"]`

**Solicitud:**

```json
{
  "mes": 1,
  "anio": 2025,
  "pagina": 1,
  "limite": 20,
  "filtros": {
    "estado": "Confirmada",
    "espacio_id": 1
  },
  "user_context": {
    "documento": "67890123",
    "rol": "propietario",
    "copropiedad": "proyecto_900111111",
    "apartamento_codigo": "A101"
  }
}
```

---

### 26. Obtener Detalle de Reserva

**Endpoint:** `POST /obtener-reserva-detalle`  
**Context Type:** `RESERVAS_DETAIL` -
`["documento", "rol", "copropiedad", "apartamento_codigo", "proyecto_nit"]`

---

### 27. Cancelar Reserva

**Endpoint:** `POST /cancelar-reserva`  
**Context Type:** `RESERVAS_CANCEL` -
`["documento", "rol", "copropiedad", "apartamento_codigo", "proyecto_nit"]`

**Solicitud:**

```json
{
  "reserva_id": 10,
  "motivo_cancelacion": "Cambio de planes",
  "user_context": {
    "documento": "67890123",
    "rol": "propietario",
    "copropiedad": "proyecto_900111111",
    "apartamento_codigo": "A101",
    "proyecto_nit": "900111111"
  }
}
```

---

### 28. Cambiar Estado de Reserva (Admin)

**Endpoint:** `POST /cambiar-estado-reserva`  
**Context Type:** `RESERVAS_ADMIN` - `["documento", "rol", "copropiedad"]`  
**Restricción:** Solo administradores

---

## SERVICIOS DE MÉTODOS DE PAGO

### 29. Crear Método de Pago

**Endpoint:** `POST /crear-metodo-pago`  
**Context Type:** `PAYMENT_METHODS_ADMIN` - `["documento", "rol", "copropiedad"]`  
**Restricción:** Solo administradores

---

### 30. Listar Métodos de Pago

**Endpoint:** `POST /listar-metodos-pago`  
**Context Type:** `PAYMENT_METHODS_LIST` - `["documento", "copropiedad"]`

---

## SERVICIOS DE PROPIETARIOS

### 31. Operaciones Administrativas de Propietarios

**Endpoint:** `POST /propietarios-admin`  
**Context Type:** `PROPIETARIOS_ADMIN` - `["documento", "rol", "copropiedad"]`  
**Restricción:** Solo administradores

---

### 32. Transferir Propiedad

**Endpoint:** `POST /transferir-propiedad`  
**Context Type:** `PROPIETARIOS_ADMIN_TRANSFER` -
`["copropiedad", "documento", "rol", "proyecto_nit"]`  
**Restricción:** Solo administradores

---

## SERVICIOS DE ASAMBLEAS

### 33. Obtener Asambleas

**Endpoint:** `POST /asambleas-proyecto`  
**Context Type:** `GET_ASSEMBLY` - `["documento", "copropiedad", "proyecto_nit"]`

**Solicitud:**

```json
{
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111",
    "proyecto_nit": "900111111"
  }
}
```

---

### 34. Validar Asistencia

**Endpoint:** `POST /validar-asistencia`  
**Context Type:** `VALIDATE_ATTENDANCE` - `["documento", "copropiedad", "proyecto_nit"]`

---

## SERVICIOS DE PODERES

### 35. Generar Poder

**Endpoint:** `POST /generar-poder`  
**Context Type:** `GENERATE_POWER` - `["documento", "rol", "proyecto_nit", "copropiedad"]`

---

### 36. Eliminar Poder

**Endpoint:** `POST /eliminar-poder`  
**Context Type:** `DELETE_POWER` - `["documento", "copropiedad", "proyecto_nit"]`

---

## SERVICIOS DE VOTACIONES

### 37. Crear Votación

**Endpoint:** `POST /crear-votacion`  
**Context Type:** `VOTACIONES_CREATE` - `["documento", "rol", "proyecto_nit", "copropiedad"]`  
**Restricción:** Solo administradores

---

### 38. Listar Votaciones

**Endpoint:** `POST /listar-votaciones`  
**Context Type:** `VOTACIONES_LIST` - `["copropiedad"]`

---

### 39. Pregunta Activa

**Endpoint:** `POST /pregunta-activa`  
**Context Type:** `ACTIVE_QUESTION` - `["documento", "copropiedad"]`

---

### 40. Gestión de Preguntas

**Endpoint:** `POST /gestion-preguntas`  
**Context Type:** `MANAGEMENT_QUESTIONS` - `["proyecto_nit", "copropiedad", "rol"]`  
**Restricción:** Solo administradores

---

## NOTAS IMPORTANTES

1. **Contexto Actualizado:** Todos los endpoints ahora usan `copropiedad` en lugar de
   `database_name`
2. **Context Types:** Cada endpoint tiene un context type específico que define qué campos del
   contexto son requeridos
3. **Validación de Roles:** Los endpoints administrativos validan el rol del usuario
4. **Paginación:** La mayoría de endpoints de listado soportan paginación con `pagina` y `limite`
5. **Filtros:** Muchos endpoints permiten filtros adicionales para refinar resultados

## SERVICIOS DE ASAMBLEAS

### 20. Crear Asamblea

**Endpoint:** `POST /crear-asamblea`  
**Context Type:** `ASAMBLEA_ADMIN` - `["documento", "rol", "copropiedad", "proyecto_nit"]`  
**Restricción:** Solo administradores

**Solicitud:**

```json
{
  "titulo": "Asamblea Ordinaria 2025",
  "descripcion": "Asamblea anual ordinaria",
  "fecha": "2025-03-15",
  "hora": "18:00",
  "lugar": "Salón Comunal",
  "modalidad": "presencial",
  "tipo_asamblea": "ordinaria",
  "quorum_requerido": "50",
  "tiempo_pregunta": "3",
  "user_context": {
    "documento": "12345678",
    "rol": "admin",
    "copropiedad": "proyecto_900111111",
    "proyecto_nit": "900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "asamblea_id": 15,
  "message": "Asamblea creada exitosamente"
}
```

---

### 21. Listar Asambleas

**Endpoint:** `POST /listar-asambleas`  
**Context Type:** `ASAMBLEA_LIST` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "filtro_estado": "programada",
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "asambleas": [
    {
      "id": 15,
      "titulo": "Asamblea Ordinaria 2025",
      "fecha": "2025-03-15",
      "hora": "18:00:00",
      "estado": "programada",
      "tipo_asamblea": "ordinaria",
      "modalidad": "presencial",
      "lugar": "Salón Comunal"
    }
  ]
}
```

---

### 22. Obtener Detalle de Asamblea

**Endpoint:** `POST /obtener-asamblea`  
**Context Type:** `ASAMBLEA_DETAIL` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "asamblea_id": 15,
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

---

### 23. Iniciar Asamblea

**Endpoint:** `POST /iniciar-asamblea`  
**Context Type:** `ASAMBLEA_ADMIN`  
**Restricción:** Solo administradores

**Solicitud:**

```json
{
  "asamblea_id": 15,
  "user_context": {
    "documento": "12345678",
    "rol": "admin",
    "copropiedad": "proyecto_900111111",
    "proyecto_nit": "900111111"
  }
}
```

---

### 24. Finalizar Asamblea

**Endpoint:** `POST /finalizar-asamblea`  
**Context Type:** `ASAMBLEA_ADMIN`  
**Restricción:** Solo administradores

---

### 25. Cancelar Asamblea

**Endpoint:** `POST /cancelar-asamblea`  
**Context Type:** `ASAMBLEA_ADMIN`  
**Restricción:** Solo administradores

---

## SERVICIOS DE APODERADOS

### 26. Crear Poder

**Endpoint:** `POST /crear-apoderado`  
**Context Type:** `APODERADO_CREATE` - `["documento", "rol", "copropiedad", "proyecto_nit"]`  
**Restricción:** Solo propietarios (máximo 30 días antes de la asamblea)

**Solicitud:**

```json
{
  "asamblea_id": 15,
  "nombre": "María González",
  "cedula": "98765432",
  "correo": "maria@email.com",
  "telefono": "3001234567",
  "apartamentos": "A101,A102",
  "user_context": {
    "documento": "67890123",
    "rol": "propietario",
    "copropiedad": "proyecto_900111111",
    "proyecto_nit": "900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Poder generado exitosamente"
}
```

**Nota:** El código OTP se envía por correo y expira en 30 días desde la creación.

---

### 27. Listar Apoderados de Asamblea

**Endpoint:** `POST /listar-apoderados`  
**Context Type:** `APODERADO_LIST` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "asamblea_id": 15,
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "apoderados": [
    {
      "id": 10,
      "documento": "98765432",
      "nombre": "María González",
      "correo": "maria@email.com",
      "apartamentos_detalle": "A101,A102",
      "coeficiente_total": "0.05",
      "codigo_usado": 0,
      "fecha_creacion": "2025-02-15T10:00:00"
    }
  ]
}
```

---

### 28. Eliminar Apoderado

**Endpoint:** `POST /eliminar-apoderado`  
**Context Type:** `APODERADO_DELETE` - `["documento", "copropiedad"]`  
**Restricción:** Solo el propietario que lo creó

**Solicitud:**

```json
{
  "apoderado_id": 10,
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

---

### 29. Login de Apoderado

**Endpoint:** `POST /login-apoderado`  
**Context Type:** `NONE`

**Solicitud:**

```json
{
  "documento": "98765432",
  "codigo_otp": "123456",
  "codigo_proyecto": "LP001"
}
```

**Respuesta:**

```json
{
  "success": true,
  "token": "jwt-token-here",
  "apoderado": {
    "documento": "98765432",
    "nombre": "María González",
    "asamblea_id": 15,
    "apartamentos": ["A101", "A102"]
  }
}
```

---

## SERVICIOS DE ASISTENCIA

### 30. Registrar Asistencia

**Endpoint:** `POST /registrar-asistencia`  
**Context Type:** `ASISTENCIA_CREATE` - `["documento", "copropiedad", "apartamento_codigo"]`

**Solicitud:**

```json
{
  "asamblea_id": 15,
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111",
    "apartamento_codigo": "A101"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Asistencia registrada exitosamente",
  "asistencia_id": 25
}
```

---

### 31. Obtener Asistentes

**Endpoint:** `POST /obtener-asistentes`  
**Context Type:** `ASISTENCIA_LIST` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "asamblea_id": 15,
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

---

## SERVICIOS DE QUÓRUM

### 32. Obtener Quórum Actual

**Endpoint:** `POST /obtener-quorum`  
**Context Type:** `QUORUM` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "asamblea_id": 15,
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "quorum": {
    "porcentaje_actual": 65.5,
    "quorum_requerido": 50,
    "quorum_alcanzado": true,
    "total_coeficientes": 1.0,
    "coeficientes_presentes": 0.655,
    "total_asistentes": 45,
    "total_apartamentos": 75
  }
}
```

---

## SERVICIOS DE VOTACIONES

### 33. Crear Votación

**Endpoint:** `POST /crear-votacion`  
**Context Type:** `VOTACION_ADMIN` - `["documento", "rol", "copropiedad"]`  
**Restricción:** Solo administradores

**Solicitud:**

```json
{
  "asamblea_id": 15,
  "titulo": "Aprobación de presupuesto 2025",
  "descripcion": "Votación para aprobar el presupuesto anual",
  "tipo_votacion": "si_no",
  "preguntas": [
    {
      "texto": "¿Aprueba el presupuesto de $500.000.000?",
      "opciones": ["Sí", "No"]
    }
  ],
  "user_context": {
    "documento": "12345678",
    "rol": "admin",
    "copropiedad": "proyecto_900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "votacion_id": 8,
  "message": "Votación creada exitosamente"
}
```

---

### 34. Activar Pregunta

**Endpoint:** `POST /activar-pregunta`  
**Context Type:** `VOTACION_ADMIN`  
**Restricción:** Solo administradores

**Solicitud:**

```json
{
  "pregunta_id": 20,
  "user_context": {
    "documento": "12345678",
    "rol": "admin",
    "copropiedad": "proyecto_900111111"
  }
}
```

---

### 35. Registrar Voto

**Endpoint:** `POST /registrar-voto`  
**Context Type:** `VOTO_CREATE` - `["documento", "copropiedad", "apartamento_codigo"]`

**Solicitud:**

```json
{
  "pregunta_id": 20,
  "opcion_seleccionada": "Sí",
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111",
    "apartamento_codigo": "A101"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Voto registrado exitosamente"
}
```

---

### 36. Obtener Pregunta Activa

**Endpoint:** `POST /obtener-pregunta-activa`  
**Context Type:** `VOTACION_DETAIL` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "asamblea_id": 15,
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "pregunta": {
    "id": 20,
    "texto": "¿Aprueba el presupuesto de $500.000.000?",
    "opciones": ["Sí", "No"],
    "tiempo_restante": 180,
    "ya_voto": false
  }
}
```

---

### 37. Obtener Resultados de Votación

**Endpoint:** `POST /obtener-resultados`  
**Context Type:** `VOTACION_DETAIL`

**Solicitud:**

```json
{
  "pregunta_id": 20,
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "resultados": {
    "pregunta": "¿Aprueba el presupuesto de $500.000.000?",
    "total_votos": 45,
    "opciones": [
      {
        "opcion": "Sí",
        "votos": 30,
        "porcentaje": 66.67,
        "coeficiente": 0.45
      },
      {
        "opcion": "No",
        "votos": 15,
        "porcentaje": 33.33,
        "coeficiente": 0.21
      }
    ],
    "estado": "finalizada"
  }
}
```

---

### 38. Cancelar Pregunta

**Endpoint:** `POST /cancelar-pregunta`  
**Context Type:** `VOTACION_ADMIN`  
**Restricción:** Solo administradores

---

## SERVICIOS DE PROPIETARIOS

### 39. Buscar Propietario

**Endpoint:** `POST /buscar-propietario`  
**Context Type:** `PROPIETARIOS_ADMIN` - `["documento", "rol", "copropiedad"]`  
**Restricción:** Solo administradores

**Solicitud:**

```json
{
  "documento": "67890123",
  "user_context": {
    "documento": "12345678",
    "rol": "admin",
    "copropiedad": "proyecto_900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "propietario": {
    "documento": "67890123",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@email.com",
    "telefono": "3001234567",
    "apartamentos": ["A101", "A102"]
  }
}
```

---

### 40. Transferir Propiedad

**Endpoint:** `POST /transferir-propiedad`  
**Context Type:** `PROPIETARIOS_ADMIN_TRANSFER` -
`["documento", "rol", "copropiedad", "proyecto_nit"]`  
**Restricción:** Solo administradores

**Solicitud:**

```json
{
  "apartamento_id": 5,
  "nuevo_propietario_documento": "11223344",
  "nuevo_propietario_nombre": "Carlos",
  "nuevo_propietario_apellido": "Ramírez",
  "nuevo_propietario_email": "carlos@email.com",
  "user_context": {
    "documento": "12345678",
    "rol": "admin",
    "copropiedad": "proyecto_900111111",
    "proyecto_nit": "900111111"
  }
}
```

---

## SERVICIOS DE CUENTAS DE PAGO

### 41. Crear Cuenta de Pago

**Endpoint:** `POST /crear-cuenta-pago`  
**Context Type:** `CUENTAS_ADMIN` - `["documento", "rol", "copropiedad"]`  
**Restricción:** Solo administradores

**Solicitud:**

```json
{
  "banco": "Bancolombia",
  "tipo_cuenta": "Ahorros",
  "numero_cuenta": "12345678901",
  "titular": "Conjunto Los Pinos",
  "user_context": {
    "documento": "12345678",
    "rol": "admin",
    "copropiedad": "proyecto_900111111"
  }
}
```

---

### 42. Listar Cuentas de Pago

**Endpoint:** `POST /listar-cuentas-pago`  
**Context Type:** `CUENTAS_LIST` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "cuentas": [
    {
      "id": 1,
      "banco": "Bancolombia",
      "tipo_cuenta": "Ahorros",
      "numero_cuenta": "12345678901",
      "titular": "Conjunto Los Pinos",
      "activa": true
    }
  ]
}
```

---

## SERVICIOS DE NOTIFICACIONES

### 43. Registrar Token FCM

**Endpoint:** `POST /registrar-token-fcm`  
**Context Type:** `FCM_TOKEN` - `["documento", "proyecto_nit"]`

**Solicitud:**

```json
{
  "token": "fcm-token-here",
  "dispositivo": "android",
  "user_context": {
    "documento": "67890123",
    "proyecto_nit": "900111111"
  }
}
```

---

### 44. Obtener Notificaciones

**Endpoint:** `POST /obtener-notificaciones`  
**Context Type:** `NOTIFICACIONES` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "pagina": 1,
  "limite": 20,
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

---

### 45. Marcar Notificación como Leída

**Endpoint:** `POST /marcar-notificacion-leida`  
**Context Type:** `NOTIFICACIONES`

**Solicitud:**

```json
{
  "notificacion_id": 50,
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

---

## SERVICIOS DE ARCHIVOS S3

### 46. Obtener URL de Subida

**Endpoint:** `POST /obtener-url-subida-s3`  
**Context Type:** `S3_UPLOAD` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "nombre_archivo": "foto.jpg",
  "tipo_archivo": "image/jpeg",
  "carpeta": "pqr",
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "upload_url": "https://s3.amazonaws.com/...",
  "file_key": "pqr/67890123/foto_123456.jpg"
}
```

---

### 47. Obtener URL de Descarga

**Endpoint:** `POST /obtener-url-descarga-s3`  
**Context Type:** `S3_DOWNLOAD` - `["documento", "copropiedad"]`

**Solicitud:**

```json
{
  "file_key": "pqr/67890123/foto_123456.jpg",
  "user_context": {
    "documento": "67890123",
    "copropiedad": "proyecto_900111111"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "download_url": "https://s3.amazonaws.com/...",
  "expira_en": 3600
}
```

---

## NOTAS IMPORTANTES

### Validaciones de Tiempo

- **Apoderados:** Solo se pueden crear cuando faltan 30 días o menos para la asamblea
- **Código OTP:** Expira 30 días después de la creación
- **Asambleas Ordinarias:** Deben crearse con mínimo 15 días de anticipación
- **Asambleas Extraordinarias:** Deben crearse con mínimo 1 hora de anticipación

### Límites de Apoderados

- Configurables por proyecto
- `max_apoderados_propietario`: Límite para propietarios regulares
- `max_apoderados_admin`: Límite para administradores
- `permiso_admin_apoderados`: Si los admins pueden ser apoderados

### Estados de Asamblea

- `programada`: Asamblea creada, aún no iniciada
- `en_curso`: Asamblea activa
- `finalizada`: Asamblea terminada
- `cancelada`: Asamblea cancelada

### Estados de Votación

- `pendiente`: Votación creada, no iniciada
- `activa`: Pregunta activa, aceptando votos
- `finalizada`: Votación terminada
- `cancelada`: Votación cancelada
