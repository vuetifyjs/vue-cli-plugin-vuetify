function addDependencies (api) {
  api.extendPackage({
    devDependencies: {
        '@vitejs/plugin-vue': '^1.2.4',
        vite: '^2.0.0',
      },
    scripts: {
      serve: 'vite preview',
      build: 'vite build',
      dev: 'vite',
    },
  })
}

function renderFiles(api, opts) {
  const files = {
    './index.html': '../templates/v3/vite/index.vite.html',
    './vite.config.js': '../templates/v3/vite/vite.config.js',
    './src/styles/_variables.scss': '../templates/v3/vite/styles/_variables.scss',
  }

  api.render(files, opts)
}

module.exports = {
  addDependencies,
  renderFiles,
}
