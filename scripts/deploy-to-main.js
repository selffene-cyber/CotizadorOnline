#!/usr/bin/env node

/**
 * Script para hacer merge de develop a main y push a GitHub
 * Uso: npm run deploy:main
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function execCommand(command, description) {
  console.log(`\n📌 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completado\n`);
    return true;
  } catch (error) {
    console.error(`❌ Error en: ${description}`);
    console.error(error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando deploy a main...\n');
  
  // Verificar que estamos en develop
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  
  if (currentBranch !== 'develop') {
    console.error(`❌ Error: Debes estar en la rama 'develop'. Actualmente estás en '${currentBranch}'`);
    console.log('\n💡 Para cambiar a develop, ejecuta: git checkout develop');
    process.exit(1);
  }
  
  // Verificar que no hay cambios sin commitear
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  if (status.trim()) {
    console.error('❌ Error: Tienes cambios sin commitear. Por favor, haz commit de tus cambios primero.');
    console.log('\n💡 Cambios pendientes:');
    console.log(status);
    process.exit(1);
  }
  
  // Preguntar por el mensaje de commit
  const commitMessage = await question('📝 Ingresa el mensaje de commit para el merge (o presiona Enter para usar el mensaje por defecto): ');
  const finalMessage = commitMessage.trim() || 'Merge develop to main - Deploy a producción';
  
  // Hacer pull de develop para asegurar que está actualizado
  if (!execCommand('git pull origin develop', 'Actualizando develop desde GitHub')) {
    console.log('⚠️  Advertencia: No se pudo actualizar develop. Continuando de todas formas...');
  }
  
  // Cambiar a main
  if (!execCommand('git checkout main', 'Cambiando a rama main')) {
    process.exit(1);
  }
  
  // Actualizar main desde GitHub
  if (!execCommand('git pull origin main', 'Actualizando main desde GitHub')) {
    console.log('⚠️  Advertencia: No se pudo actualizar main. Continuando de todas formas...');
  }
  
  // Hacer merge de develop a main
  if (!execCommand(`git merge develop -m "${finalMessage}"`, 'Haciendo merge de develop a main')) {
    console.error('\n❌ Error al hacer merge. Puede haber conflictos.');
    console.log('💡 Resuelve los conflictos manualmente y luego ejecuta:');
    console.log('   git add .');
    console.log('   git commit -m "Resolve merge conflicts"');
    console.log('   git push origin main');
    console.log('   git checkout develop');
    process.exit(1);
  }
  
  // Hacer push a main
  if (!execCommand('git push origin main', 'Haciendo push a main en GitHub')) {
    process.exit(1);
  }
  
  // Volver a develop
  if (!execCommand('git checkout develop', 'Volviendo a rama develop')) {
    process.exit(1);
  }
  
  console.log('\n🎉 ¡Deploy completado exitosamente!');
  console.log('✅ Los cambios de develop se han mergeado a main y pusheado a GitHub');
  console.log('✅ Easypanel debería detectar el cambio y hacer deploy automáticamente');
  console.log('\n📌 Estás de vuelta en la rama develop');
  
  rl.close();
}

main().catch(error => {
  console.error('❌ Error inesperado:', error);
  rl.close();
  process.exit(1);
});

