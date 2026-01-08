const fs = require("fs");
const path = require("path");

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (
        !["node_modules", ".git", "dist", "build", ".expo", "test"].includes(
          file
        )
      ) {
        findFiles(filePath, fileList);
      }
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  // Find all @expo/vector-icons imports
  const badImportRegex =
    /import\s+(\w+)\s+from\s+['"]@expo\/vector-icons\/\w+['"]\s*;?\s*/g;
  const goodImportRegex =
    /import\s+{\s*([^}]+)\s*}\s+from\s+['"]@expo\/vector-icons['"]\s*;?\s*/g;

  const badMatches = [...content.matchAll(badImportRegex)];
  const goodMatches = [...content.matchAll(goodImportRegex)];

  if (badMatches.length > 0 || goodMatches.length > 1) {
    // Collect all icon libraries
    const iconLibs = new Set();

    // From bad imports
    badMatches.forEach((match) => {
      iconLibs.add(match[1].trim());
    });

    // From existing good imports
    goodMatches.forEach((match) => {
      const libs = match[1].split(",").map((l) => l.trim());
      libs.forEach((lib) => iconLibs.add(lib));
    });

    // Remove all old imports
    badMatches.forEach((match) => {
      content = content.replace(match[0], "");
    });
    goodMatches.forEach((match) => {
      content = content.replace(match[0], "");
    });

    // Clean up extra newlines
    content = content.replace(/\n\n\n+/g, "\n\n");
    content = content.replace(/^\s*\n/gm, "\n");

    // Create consolidated import
    const sortedLibs = Array.from(iconLibs).sort();
    const newImport = `import { ${sortedLibs.join(", ")} } from "@expo/vector-icons";\n`;

    // Find first import position
    const firstImportMatch = content.match(
      /^import\s+.*from\s+['"].*['"];?\s*$/m
    );
    if (firstImportMatch) {
      const insertPos =
        content.indexOf(firstImportMatch[0]) + firstImportMatch[0].length;
      content =
        content.slice(0, insertPos) +
        "\n" +
        newImport +
        content.slice(insertPos);
    } else {
      content = newImport + content;
    }

    // Clean up again
    content = content.replace(/\n\n\n+/g, "\n\n");

    fs.writeFileSync(filePath, content, "utf8");
    modified = true;
  }

  return modified;
}

const rootDir = path.join(__dirname, "..");
const files = findFiles(rootDir);
let fixedCount = 0;

console.log(`🔧 Consolidando imports en ${files.length} archivos...\n`);

files.forEach((file) => {
  if (fixFile(file)) {
    const relativePath = path.relative(rootDir, file);
    console.log(`✅ ${relativePath}`);
    fixedCount++;
  }
});

console.log(`\n✨ Se consolidaron imports en ${fixedCount} archivos\n`);
