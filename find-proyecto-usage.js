const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const extensions = [".ts", ".tsx", ".js", ".jsx"];
const excludeDirs = ["node_modules", ".expo", "dist", "build", ".git"];

const patterns = {
  getProyectosUsuario: /getProyectosUsuario/g,
  tipoProyecto: /import.*Proyecto.*from|:\s*Proyecto\b/g,

  // Propiedades VIEJAS (snake_case / PascalCase) - A CAMBIAR
  OLD_NIT: /\.NIT\b/g,
  OLD_Nombre: /\.Nombre\b/g,
  OLD_rol_usuario: /\.rol_usuario\b/g,
  OLD_poderes_habilitados: /\.poderes_habilitados\b/g,
  OLD_max_apoderados_propietario: /\.max_apoderados_propietario\b/g,
  OLD_max_apoderados_admin: /\.max_apoderados_admin\b/g,
  OLD_permiso_admin_apoderados: /\.permiso_admin_apoderados\b/g,

  // Propiedades NUEVAS (camelCase) - YA CORRECTAS
  NEW_nit: /\.nit\b/g,
  NEW_nombre: /\.nombre\b/g,
  NEW_rolUsuario: /\.rolUsuario\b/g,
  NEW_poderesHabilitados: /\.poderesHabilitados\b/g,
  NEW_maxApoderadosPropietario: /\.maxApoderadosPropietario\b/g,
  NEW_maxApoderadosAdmin: /\.maxApoderadosAdmin\b/g,
  NEW_permisoAdminApoderados: /\.permisoAdminApoderados\b/g,

  // Propiedades comunes
  copropiedad: /\.copropiedad\b/g,
  descripcion: /\.descripcion\b/g,
  estado: /\.estado\b/g,
  codigo: /\.codigo\b/g,

  useProject: /useProject\(/g,
};

const results = {};
Object.keys(patterns).forEach((key) => (results[key] = []));

function searchInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const relativePath = path.relative(rootDir, filePath);

    Object.entries(patterns).forEach(([key, pattern]) => {
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        if (pattern.test(line)) {
          results[key].push({
            file: relativePath,
            line: idx + 1,
            content: line.trim(),
          });
        }
      });
    });
  } catch (err) {
    // Ignorar errores de lectura
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        walkDir(filePath);
      }
    } else if (extensions.includes(path.extname(file))) {
      searchInFile(filePath);
    }
  });
}

console.log("🔍 Buscando usos de Proyecto y getProyectosUsuario...\n");
walkDir(rootDir);

console.log("═══════════════════════════════════════════════════════════");
console.log("📊 RESULTADOS DE BÚSQUEDA");
console.log("═══════════════════════════════════════════════════════════\n");

// Separar resultados en categorías
const oldProps = {};
const newProps = {};
const others = {};

Object.entries(results).forEach(([key, matches]) => {
  if (key.startsWith("OLD_")) {
    oldProps[key] = matches;
  } else if (key.startsWith("NEW_")) {
    newProps[key] = matches;
  } else {
    others[key] = matches;
  }
});

// Mostrar propiedades VIEJAS (a cambiar)
console.log("\n🔴 PROPIEDADES VIEJAS (A CAMBIAR):");
console.log("═".repeat(60));
Object.entries(oldProps).forEach(([key, matches]) => {
  if (matches.length > 0) {
    const propName = key.replace("OLD_", "");
    const uniqueFiles = [...new Set(matches.map((m) => m.file))];
    console.log(
      `\n  ${propName}: ${matches.length} usos en ${uniqueFiles.length} archivos`
    );
    uniqueFiles.slice(0, 5).forEach((file) => console.log(`    • ${file}`));
    if (uniqueFiles.length > 5)
      console.log(`    ... y ${uniqueFiles.length - 5} más`);
  }
});

// Mostrar propiedades NUEVAS (ya correctas)
console.log("\n\n🟢 PROPIEDADES NUEVAS (YA CORRECTAS):");
console.log("═".repeat(60));
Object.entries(newProps).forEach(([key, matches]) => {
  if (matches.length > 0) {
    const propName = key.replace("NEW_", "");
    const uniqueFiles = [...new Set(matches.map((m) => m.file))];
    console.log(
      `\n  ${propName}: ${matches.length} usos en ${uniqueFiles.length} archivos`
    );
    uniqueFiles.slice(0, 5).forEach((file) => console.log(`    • ${file}`));
    if (uniqueFiles.length > 5)
      console.log(`    ... y ${uniqueFiles.length - 5} más`);
  }
});

// Mostrar otros
console.log("\n\n📋 OTRAS BÚSQUEDAS:");
console.log("═".repeat(60));
Object.entries(others).forEach(([key, matches]) => {
  if (matches.length > 0) {
    const uniqueFiles = [...new Set(matches.map((m) => m.file))];
    console.log(
      `\n  ${key}: ${matches.length} usos en ${uniqueFiles.length} archivos`
    );
  }
});

console.log("\n\n═══════════════════════════════════════════════════════════");
console.log("📋 RESUMEN FINAL");
console.log("═══════════════════════════════════════════════════════════\n");

// Contar archivos con propiedades viejas
const filesWithOldProps = new Set();
Object.entries(oldProps).forEach(([key, matches]) => {
  matches.forEach((match) => filesWithOldProps.add(match.file));
});

// Contar archivos con propiedades nuevas
const filesWithNewProps = new Set();
Object.entries(newProps).forEach(([key, matches]) => {
  matches.forEach((match) => filesWithNewProps.add(match.file));
});

console.log(
  `🔴 Archivos con propiedades VIEJAS (a modificar): ${filesWithOldProps.size}`
);
[...filesWithOldProps].sort().forEach((file) => console.log(`  • ${file}`));

console.log(
  `\n🟢 Archivos con propiedades NUEVAS (ya correctos): ${filesWithNewProps.size}`
);
[...filesWithNewProps].sort().forEach((file) => console.log(`  • ${file}`));

// Calcular total de cambios necesarios
let totalChanges = 0;
Object.values(oldProps).forEach((matches) => (totalChanges += matches.length));

console.log(`\n📊 TOTAL DE CAMBIOS NECESARIOS: ${totalChanges}`);
console.log("\n✅ Búsqueda completada\n");
