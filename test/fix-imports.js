const fs = require("fs");
const path = require("path");

const REPLACEMENTS = [
  {
    from: /import\s+(\w+)\s+from\s+['"]@expo\/vector-icons\/(\w+)['"]/g,
    to: 'import { $1 } from "@expo/vector-icons"',
  },
];

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

  const regex = /import\s+(\w+)\s+from\s+['"]@expo\/vector-icons\/\w+['"]/g;
  const matches = [...content.matchAll(regex)];

  if (matches.length > 0) {
    const iconLibs = matches.map((m) => m[1]);
    const importStatement = `import { ${iconLibs.join(", ")} } from "@expo/vector-icons"`;

    // Remove old imports
    matches.forEach((match) => {
      content = content.replace(match[0], "");
    });

    // Clean up extra newlines
    content = content.replace(/\n\n\n+/g, "\n\n");

    // Add new import after first import or at top
    const firstImportMatch = content.match(
      /^import\s+.*from\s+['"].*['"];?\s*$/m
    );
    if (firstImportMatch) {
      const insertPos =
        content.indexOf(firstImportMatch[0]) + firstImportMatch[0].length;
      content =
        content.slice(0, insertPos) +
        "\n" +
        importStatement +
        content.slice(insertPos);
    } else {
      content = importStatement + "\n" + content;
    }

    fs.writeFileSync(filePath, content, "utf8");
    modified = true;
  }

  return modified;
}

const rootDir = path.join(__dirname, "..");
const files = findFiles(rootDir);
let fixedCount = 0;

console.log(`🔧 Corrigiendo imports en ${files.length} archivos...\n`);

files.forEach((file) => {
  if (fixFile(file)) {
    const relativePath = path.relative(rootDir, file);
    console.log(`✅ ${relativePath}`);
    fixedCount++;
  }
});

console.log(`\n✨ Se corrigieron ${fixedCount} archivos\n`);
