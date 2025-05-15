// Script para verificar importaciones de AuthContext
const fs = require('fs');
const path = require('path');

const directoriesToSearch = [
  'src/components',
  'src/pages',
];

const searchForPattern = (dirPath, pattern) => {
  console.log(`Buscando importaciones en ${dirPath}...`);
  const results = [];

  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      // Si es un directorio, recursivamente buscar en él
      results.push(...searchForPattern(filePath, pattern));
    } else if (stats.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
      // Si es un archivo JavaScript o JSX, buscar el patrón
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(pattern)) {
        results.push({
          filePath,
          line: content.split('\n').findIndex(line => line.includes(pattern)) + 1,
          content: content.split('\n').find(line => line.includes(pattern))
        });
      }
    }
  }
  
  return results;
}

// Buscar importaciones incorrectas (contexts)
const wrongImports = searchForPattern('src', '../contexts/AuthContext');
console.log('\n=== Importaciones incorrectas (contextsS) ===');
if (wrongImports.length === 0) {
  console.log('✅ No se encontraron importaciones incorrectas');
} else {
  console.log('❌ Se encontraron importaciones incorrectas:');
  wrongImports.forEach(result => {
    console.log(`📄 ${result.filePath}:${result.line}: ${result.content.trim()}`);
  });
}

// Buscar importaciones correctas (context)
const correctImports = searchForPattern('src', '../context/AuthContext');
console.log('\n=== Importaciones correctas (contexT) ===');
if (correctImports.length === 0) {
  console.log('❌ No se encontraron importaciones correctas');
} else {
  console.log('✅ Se encontraron importaciones correctas:');
  correctImports.forEach(result => {
    console.log(`📄 ${result.filePath}:${result.line}: ${result.content.trim()}`);
  });
}

console.log('\n=== Resumen ===');
console.log(`Total de importaciones incorrectas: ${wrongImports.length}`);
console.log(`Total de importaciones correctas: ${correctImports.length}`);

if (wrongImports.length > 0) {
  console.log('\n❗ Por favor, corrige las importaciones identificadas para resolver los problemas de contexto.');
} else {
  console.log('\n✅ Todas las importaciones son correctas.');
} 