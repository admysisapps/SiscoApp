const fs = require("fs");
const path = require("path");

const BAD_PATTERNS = [
  /import\s+\w+\s+from\s+['"]@expo\/vector-icons\/\w+['"]/g,
  /import\s+\*\s+as\s+\w+\s+from\s+['"]@expo\/vector-icons['"]/g,
];

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!["node_modules", ".git", "dist", "build", ".expo"].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const issues = [];

  BAD_PATTERNS.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        issues.push({
          file: filePath,
          line: content.substring(0, content.indexOf(match)).split("\n").length,
          import: match,
        });
      });
    }
  });

  return issues;
}

const rootDir = path.join(__dirname, "..");
const files = findFiles(rootDir);
const allIssues = [];

console.log(`🔍 Analizando ${files.length} archivos...\n`);

files.forEach((file) => {
  const issues = analyzeFile(file);
  if (issues.length > 0) {
    allIssues.push(...issues);
  }
});

if (allIssues.length === 0) {
  console.log("✅ No se encontraron imports problemáticos\n");
} else {
  console.log(`❌ Se encontraron ${allIssues.length} imports problemáticos:\n`);

  allIssues.forEach((issue) => {
    const relativePath = path.relative(rootDir, issue.file);
    console.log(`📁 ${relativePath}:${issue.line}`);
    console.log(`   ${issue.import}`);
    console.log("");
  });

  console.log("\n💡 Solución: Cambiar a imports específicos:");
  console.log(
    '   import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";\n'
  );
}

process.exit(allIssues.length > 0 ? 1 : 0);
