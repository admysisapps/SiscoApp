-- Schema para crear tenants

SET FOREIGN_KEY_CHECKS=0;


-- Tabla: apartamentos
DROP TABLE IF EXISTS `apartamentos`;

CREATE TABLE `apartamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo_apt` varchar(10) NOT NULL,
  `numero` varchar(10) NOT NULL,
  `bloque` varchar(20) DEFAULT NULL,
  `coeficiente` decimal(8,6) DEFAULT NULL,
  `propietario_documento` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_numero_bloque` (`numero`,`bloque`),
  KEY `idx_propietario_documento` (`propietario_documento`),
  CONSTRAINT `apartamentos_ibfk_1` FOREIGN KEY (`propietario_documento`) REFERENCES `usuarios` (`documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: apoderados
DROP TABLE IF EXISTS `apoderados`;

CREATE TABLE `apoderados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `documento` varchar(20) DEFAULT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `correo` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `asamblea_id` int DEFAULT NULL,
  `proyecto_nit` varchar(20) DEFAULT NULL,
  `usuario_id` varchar(20) DEFAULT NULL,
  `apartamentos_detalle` text,
  `coeficiente_total` decimal(10,6) DEFAULT NULL,
  `codigo_otp` varchar(10) DEFAULT NULL,
  `codigo_expiracion` datetime DEFAULT NULL,
  `codigo_usado` tinyint DEFAULT NULL,
  `reingresar` tinyint DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_documento_proyecto_asamblea` (`documento`,`proyecto_nit`,`asamblea_id`),
  KEY `idx_asamblea_id` (`asamblea_id`),
  KEY `idx_otp_correo_doc` (`codigo_otp`,`correo`,`documento`),
  CONSTRAINT `apoderados_ibfk_1` FOREIGN KEY (`asamblea_id`) REFERENCES `asambleas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: asambleas
DROP TABLE IF EXISTS `asambleas`;

CREATE TABLE `asambleas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) NOT NULL,
  `descripcion` varchar(250) DEFAULT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `lugar` varchar(100) DEFAULT NULL,
  `modalidad` enum('presencial','virtual','mixta') NOT NULL DEFAULT 'presencial',
  `enlace_virtual` varchar(255) DEFAULT NULL,
  `estado` enum('programada','en_curso','finalizada','cancelada') NOT NULL DEFAULT 'programada',
  `tipo_asamblea` enum('ordinaria','extraordinaria') NOT NULL DEFAULT 'ordinaria',
  `quorum_requerido` decimal(8,6) DEFAULT NULL,
  `quorum_alcanzado` decimal(8,6) DEFAULT NULL,
  `proyecto_nit` varchar(20) NOT NULL,
  `creador_documento` varchar(20) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT NULL,
  `tiempo_pregunta` int DEFAULT '5',
  `archivos_nombres` text,
  PRIMARY KEY (`id`),
  KEY `creador_documento` (`creador_documento`),
  KEY `idx_estado` (`estado`),
  KEY `idx_proyecto_nit` (`proyecto_nit`),
  CONSTRAINT `asambleas_ibfk_1` FOREIGN KEY (`creador_documento`) REFERENCES `usuarios` (`documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: asistencia_asamblea
DROP TABLE IF EXISTS `asistencia_asamblea`;

CREATE TABLE `asistencia_asamblea` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asamblea_id` int NOT NULL,
  `apartamento_id` int NOT NULL,
  `codigo_apartamento` varchar(10) NOT NULL,
  `coeficiente_apartamento` decimal(8,6) DEFAULT NULL,
  `documento_propietario` varchar(20) NOT NULL,
  `documento_asistente` varchar(20) NOT NULL,
  `tipo_asistente` enum('propietario','apoderado') NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_apartamento_asamblea` (`asamblea_id`,`apartamento_id`),
  KEY `apartamento_id` (`apartamento_id`),
  KEY `idx_asistente` (`documento_asistente`),
  CONSTRAINT `asistencia_asamblea_ibfk_1` FOREIGN KEY (`asamblea_id`) REFERENCES `asambleas` (`id`),
  CONSTRAINT `asistencia_asamblea_ibfk_2` FOREIGN KEY (`apartamento_id`) REFERENCES `apartamentos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: avisos
DROP TABLE IF EXISTS `avisos`;

CREATE TABLE `avisos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tipo` enum('advertencia','recordatorio','pago','general','mantenimiento','emergencia') NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_evento` timestamp NULL DEFAULT NULL,
  `push` tinyint(1) DEFAULT '0',
  `prioridad` enum('baja','media','alta','urgente') DEFAULT 'media',
  `archivos_nombres` text,
  PRIMARY KEY (`id`),
  KEY `idx_fecha_creacion` (`fecha_creacion`),
  KEY `idx_fecha_evento` (`fecha_evento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: bitacora
DROP TABLE IF EXISTS `bitacora`;

CREATE TABLE `bitacora` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_documento` varchar(20) DEFAULT NULL,
  `responsable` varchar(20) NOT NULL,
  `modulo` varchar(100) NOT NULL,
  `accion` varchar(100) NOT NULL,
  `detalles` json DEFAULT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_responsable_fecha` (`responsable`,`fecha`),
  KEY `idx_modulo_accion` (`modulo`,`accion`),
  KEY `idx_usuario_fecha` (`usuario_documento`,`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: cuentas_pago
DROP TABLE IF EXISTS `cuentas_pago`;

CREATE TABLE `cuentas_pago` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre_banco` varchar(120) NOT NULL,
  `tipo_cuenta` enum('ahorros','corriente','pasarela','fisico','billeteras_digitales') NOT NULL,
  `titular` varchar(180) NOT NULL,
  `numero_cuenta` varchar(64) DEFAULT NULL,
  `descripcion` varchar(500) NOT NULL,
  `enlace_pago` varchar(2048) DEFAULT NULL,
  `informacion_adicional` text,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_titular` (`titular`),
  KEY `idx_unique_cuenta` (`nombre_banco`,`numero_cuenta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: documentos
DROP TABLE IF EXISTS `documentos`;

CREATE TABLE `documentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_archivo` varchar(255) NOT NULL,
  `nombre_original` varchar(255) NOT NULL,
  `tamano` bigint NOT NULL,
  `subido_por` varchar(20) NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `visible_cop` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: espacios_comunes
DROP TABLE IF EXISTS `espacios_comunes`;

CREATE TABLE `espacios_comunes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(2000) DEFAULT NULL,
  `reglas` varchar(2500) DEFAULT NULL,
  `estado` enum('activa','inactiva','mantenimiento') DEFAULT 'activa',
  `fecha_mantenimiento` date DEFAULT NULL,
  `tipo_reserva` enum('por_minutos','por_horas','bloque_fijo','gratuito') DEFAULT 'por_horas',
  `costo` decimal(10,2) DEFAULT '0.00',
  `duracion_bloque` int DEFAULT '240',
  `capacidad_maxima` int DEFAULT '1',
  `tiempo_minimo_reserva` int DEFAULT '60',
  `tiempo_maximo_reserva` int DEFAULT '240',
  `tiempo_reserva` enum('6','12','24','48') DEFAULT '24',
  `requiere_aprobacion` tinyint(1) DEFAULT '0',
  `imagen_nombre` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_estado_tipo` (`estado`,`tipo_reserva`),
  KEY `idx_fecha_creacion` (`fecha_creacion`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_requiere_aprobacion` (`requiere_aprobacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: espacios_horarios
DROP TABLE IF EXISTS `espacios_horarios`;

CREATE TABLE `espacios_horarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `espacio_id` int NOT NULL,
  `dia_semana` tinyint NOT NULL,
  `hora_inicio` time NOT NULL DEFAULT '06:00:00',
  `hora_fin` time NOT NULL DEFAULT '22:00:00',
  `activo` tinyint(1) DEFAULT '1',
  `precio_especial` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_espacio_dia` (`espacio_id`,`dia_semana`),
  KEY `idx_dia_activo` (`dia_semana`,`activo`),
  KEY `idx_activo_horario` (`activo`,`hora_inicio`,`hora_fin`),
  CONSTRAINT `espacios_horarios_ibfk_1` FOREIGN KEY (`espacio_id`) REFERENCES `espacios_comunes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: opciones_respuesta
DROP TABLE IF EXISTS `opciones_respuesta`;

CREATE TABLE `opciones_respuesta` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pregunta_id` int NOT NULL,
  `opcion` varchar(150) NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pregunta` (`pregunta_id`),
  CONSTRAINT `opciones_respuesta_ibfk_1` FOREIGN KEY (`pregunta_id`) REFERENCES `preguntas_votacion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: participantes_votacion
DROP TABLE IF EXISTS `participantes_votacion`;

CREATE TABLE `participantes_votacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asamblea_id` int NOT NULL,
  `documento_participante` varchar(20) NOT NULL,
  `coeficiente_total` decimal(8,6) DEFAULT NULL,
  `apartamentos_count` int NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `presente` tinyint(1) DEFAULT '1',
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_participante` (`asamblea_id`,`documento_participante`),
  CONSTRAINT `participantes_votacion_ibfk_1` FOREIGN KEY (`asamblea_id`) REFERENCES `asambleas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: pqr
DROP TABLE IF EXISTS `pqr`;

CREATE TABLE `pqr` (
  `id_pqr` int NOT NULL AUTO_INCREMENT,
  `id_apartamento` int NOT NULL,
  `documento_creador` varchar(20) NOT NULL,
  `tipo_peticion` enum('Petición','Queja','Reclamo') NOT NULL,
  `estado_pqr` enum('Pendiente','En Proceso','Resuelto','Cerrado Sin Solución','Anulado') DEFAULT 'Pendiente',
  `asunto` varchar(200) NOT NULL,
  `descripcion` text NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `archivo_nombre` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_pqr`),
  KEY `fk_apartamento` (`id_apartamento`),
  KEY `fk_creador` (`documento_creador`),
  CONSTRAINT `fk_apartamento` FOREIGN KEY (`id_apartamento`) REFERENCES `apartamentos` (`id`),
  CONSTRAINT `fk_creador` FOREIGN KEY (`documento_creador`) REFERENCES `usuarios` (`documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: pqr_mensajes
DROP TABLE IF EXISTS `pqr_mensajes`;

CREATE TABLE `pqr_mensajes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_pqr` int NOT NULL,
  `documento_usuario` varchar(20) NOT NULL,
  `mensaje` text NOT NULL,
  `es_admin` tinyint(1) DEFAULT '0',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pqr_fecha` (`id_pqr`,`fecha_creacion`),
  KEY `idx_usuario` (`documento_usuario`),
  CONSTRAINT `pqr_mensajes_ibfk_1` FOREIGN KEY (`id_pqr`) REFERENCES `pqr` (`id_pqr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: preguntas_votacion
DROP TABLE IF EXISTS `preguntas_votacion`;

CREATE TABLE `preguntas_votacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `votacion_id` int NOT NULL,
  `pregunta` text NOT NULL,
  `tipo_pregunta` enum('si_no','multiple') NOT NULL,
  `orden` int NOT NULL DEFAULT '1',
  `estado` enum('programada','en_curso','finalizada','cancelada') DEFAULT 'programada',
  `fecha_inicio` timestamp NULL DEFAULT NULL,
  `fecha_fin` timestamp NULL DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_votacion_estado` (`votacion_id`,`estado`),
  KEY `idx_votacion_orden` (`votacion_id`,`orden`),
  CONSTRAINT `preguntas_votacion_ibfk_1` FOREIGN KEY (`votacion_id`) REFERENCES `votaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: publicaciones
DROP TABLE IF EXISTS `publicaciones`;

CREATE TABLE `publicaciones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tipo` enum('inmuebles','servicios','productos') NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `precio` decimal(15,2) NOT NULL,
  `negociable` tinyint DEFAULT '0',
  `contacto` varchar(255) NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` timestamp NOT NULL,
  `estado` enum('activa','pausada','finalizada','expirada','bloqueada') DEFAULT 'activa',
  `usuario_documento` varchar(20) NOT NULL,
  `archivos_nombres` text,
  `fecha_moderacion` timestamp NULL DEFAULT NULL,
  `razon_bloqueo` text,
  PRIMARY KEY (`id`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_estado` (`estado`),
  KEY `idx_usuario` (`usuario_documento`),
  KEY `idx_fecha_expiracion` (`fecha_expiracion`),
  CONSTRAINT `publicaciones_ibfk_1` FOREIGN KEY (`usuario_documento`) REFERENCES `usuarios` (`documento`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: reservas
DROP TABLE IF EXISTS `reservas`;

CREATE TABLE `reservas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_apartamento` int NOT NULL,
  `documento_usuario` varchar(20) NOT NULL,
  `espacio_id` int NOT NULL,
  `fecha_reserva` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `datetime_inicio` datetime DEFAULT NULL,
  `datetime_fin` datetime DEFAULT NULL,
  `estado_reserva` enum('Pendiente','Confirmada','Cancelada','Rechazada','Completada') DEFAULT 'Pendiente',
  `motivo` varchar(255) DEFAULT NULL,
  `observaciones` text,
  `precio_total` decimal(10,2) DEFAULT NULL,
  `duracion_minutos` int NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_cancelacion` timestamp NULL DEFAULT NULL,
  `motivo_cancelacion` text,
  PRIMARY KEY (`id`),
  KEY `idx_apartamento_fecha` (`id_apartamento`,`fecha_reserva`),
  KEY `idx_espacio_fecha` (`espacio_id`,`fecha_reserva`),
  KEY `idx_estado` (`estado_reserva`),
  KEY `idx_fecha_reserva` (`fecha_reserva`),
  CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`id_apartamento`) REFERENCES `apartamentos` (`id`),
  CONSTRAINT `reservas_ibfk_2` FOREIGN KEY (`espacio_id`) REFERENCES `espacios_comunes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: resultados_votacion
DROP TABLE IF EXISTS `resultados_votacion`;

CREATE TABLE `resultados_votacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pregunta_id` int NOT NULL,
  `opcion_id` int NOT NULL,
  `total_votos` int NOT NULL DEFAULT '0',
  `total_coeficiente` decimal(10,6) NOT NULL DEFAULT '0.000000',
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pregunta_opcion` (`pregunta_id`,`opcion_id`),
  KEY `opcion_id` (`opcion_id`),
  CONSTRAINT `resultados_votacion_ibfk_1` FOREIGN KEY (`pregunta_id`) REFERENCES `preguntas_votacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `resultados_votacion_ibfk_2` FOREIGN KEY (`opcion_id`) REFERENCES `opciones_respuesta` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: usuarios
DROP TABLE IF EXISTS `usuarios`;

CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `documento` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_documento` (`documento`),
  KEY `idx_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: votaciones
DROP TABLE IF EXISTS `votaciones`;

CREATE TABLE `votaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asamblea_id` int NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text,
  `estado` enum('programada','activa','finalizada') DEFAULT 'programada',
  `fecha_inicio` timestamp NULL DEFAULT NULL,
  `fecha_fin` timestamp NULL DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_asamblea_estado` (`asamblea_id`,`estado`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `votaciones_ibfk_1` FOREIGN KEY (`asamblea_id`) REFERENCES `asambleas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: votos
DROP TABLE IF EXISTS `votos`;

CREATE TABLE `votos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pregunta_id` int NOT NULL,
  `opcion_id` int NOT NULL,
  `documento_participante` varchar(20) NOT NULL,
  `coeficiente_usado` decimal(8,6) NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_participante_pregunta` (`documento_participante`,`pregunta_id`),
  KEY `opcion_id` (`opcion_id`),
  KEY `idx_pregunta` (`pregunta_id`),
  KEY `idx_fecha_registro` (`fecha_registro`),
  CONSTRAINT `votos_ibfk_1` FOREIGN KEY (`pregunta_id`) REFERENCES `preguntas_votacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `votos_ibfk_2` FOREIGN KEY (`opcion_id`) REFERENCES `opciones_respuesta` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


SET FOREIGN_KEY_CHECKS=1;
