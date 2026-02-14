-- Schema para crear tenants
-- Generado automáticamente

SET FOREIGN_KEY_CHECKS=0;


-- Tabla: sisco_central_notificaciones
DROP TABLE IF EXISTS `notificaciones`;

CREATE TABLE `notificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_documento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `proyecto_nit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `push_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dispositivo_tipo` enum('ios','android','web') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dispositivo_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `notificaciones_habilitadas` tinyint(1) DEFAULT '1',
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_uso` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_token` (`usuario_documento`,`proyecto_nit`,`push_token`),
  UNIQUE KEY `unique_user_project_device` (`usuario_documento`,`proyecto_nit`,`dispositivo_id`),
  KEY `idx_usuario_activo` (`usuario_documento`,`activo`,`notificaciones_habilitadas`),
  KEY `idx_token_activo` (`push_token`,`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Tabla: sisco_central_proyectos
DROP TABLE IF EXISTS `proyectos`;

CREATE TABLE `proyectos` (
  `nit` varchar(20) NOT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `codigo` varchar(20) DEFAULT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `database_name` varchar(100) DEFAULT NULL,
  `poderes_habilitados` tinyint(1) DEFAULT NULL,
  `max_apoderados_propietario` int DEFAULT NULL,
  `max_apoderados_admin` int DEFAULT NULL,
  `permiso_admin_apoderados` tinyint(1) DEFAULT NULL,
  `descripcion` text,
  `fecha_creacion` datetime DEFAULT NULL,
  `fecha_actualizacion` datetime DEFAULT NULL,
  `database_host` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`nit`),
  UNIQUE KEY `codigo_invitacion` (`codigo`),
  KEY `idx_estado` (`estado`),
  KEY `idx_database_name` (`database_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Tabla: sisco_central_usuarios_sistema
DROP TABLE IF EXISTS `usuarios_sistema`;

CREATE TABLE `usuarios_sistema` (
  `id` int NOT NULL AUTO_INCREMENT,
  `documento` varchar(20) DEFAULT NULL,
  `proyecto_nit` varchar(20) DEFAULT NULL,
  `rol` varchar(20) DEFAULT NULL,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_documento_proyecto_rol` (`documento`,`proyecto_nit`,`rol`),
  KEY `proyecto_nit` (`proyecto_nit`),
  CONSTRAINT `usuarios_sistema_ibfk_1` FOREIGN KEY (`proyecto_nit`) REFERENCES `proyectos` (`nit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


SET FOREIGN_KEY_CHECKS=1;
