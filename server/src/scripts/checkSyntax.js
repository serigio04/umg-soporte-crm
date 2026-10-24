const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function archivosJavaScript(directorio) {
  return fs.readdirSync(directorio, { withFileTypes: true }).flatMap(entrada => {
    const ruta = path.join(directorio, entrada.name)
    if (entrada.isDirectory()) return archivosJavaScript(ruta)
    return entrada.isFile() && entrada.name.endsWith('.js') ? [ruta] : []
  })
}

for (const archivo of archivosJavaScript(root)) {
  const resultado = spawnSync(process.execPath, ['--check', archivo], { stdio: 'inherit' })
  if (resultado.status !== 0) process.exit(resultado.status || 1)
}

console.log('Sintaxis valida')
