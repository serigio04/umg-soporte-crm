const path = require('node:path')

const serverRoot = path.resolve(__dirname, '../../..')

function loadWithMocks(target, mocks) {
  const originals = new Map()

  for (const [modulePath, exports] of Object.entries(mocks)) {
    const resolvedPath = path.join(serverRoot, modulePath)
    originals.set(resolvedPath, require.cache[resolvedPath])
    require.cache[resolvedPath] = {
      id: resolvedPath,
      filename: resolvedPath,
      loaded: true,
      exports
    }
  }

  const targetPath = path.join(serverRoot, target)
  delete require.cache[targetPath]
  const loadedModule = require(targetPath)

  for (const [modulePath, original] of originals) {
    if (original) require.cache[modulePath] = original
    else delete require.cache[modulePath]
  }

  return loadedModule
}

module.exports = { loadWithMocks }
