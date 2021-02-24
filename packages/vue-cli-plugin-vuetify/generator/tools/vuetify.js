// Imports
const helpers = require('./helpers')

function addDependencies (api, v3) {
  api.extendPackage({
    dependencies: {
      vuetify: v3 ? "^3.0.0-alpha.0" : "^2.4.0",
    },
  })
}

function renderFiles (api, { opts }) {
  const hasTS = api.hasPlugin('typescript')
  const ext = hasTS ? 'ts' : 'js'
  const pluginFilename = `vuetify.${ext}`

  api.render({
    [`./src/plugins/${pluginFilename}`]: '../templates/default/src/plugins/vuetify.js',
  }, {
    ...opts,
    typescript: hasTS,
  })

  if (hasTS && opts.useAlaCarte) {
    api.render({
      './src/shims-vuetify.d.ts': '../templates/default/src/shims-vuetify.d.ts',
    })
  }

  // Render files if we're replacing
  const fs = require('fs')
  const routerPath = api.resolve(`./src/router.${ext}`)
  opts.router = fs.existsSync(routerPath)

  if (opts.replaceComponents) {
    const files = {
      './src/App.vue': `../templates/default/src/App.${ext}.vue`,
      './src/assets/logo.svg': '../templates/default/src/assets/logo.svg',
      './src/components/HelloWorld.vue': `../templates/default/src/components/HelloWorld.${ext}.vue`,
    }

    if (opts.router) {
      files['./src/views/Home.vue'] = `../templates/default/src/views/Home.${ext}.vue`
    }

    api.render(files, opts)
  }
}

function addImports (api) {
  api.injectImports(api.entryFile, 'import vuetify from \'./plugins/vuetify\';')
  api.injectRootOptions(api.entryFile, 'vuetify')
}

function setHtmlLang (api, locale) {
  helpers.updateFile(api, './public/index.html', lines => {
    const htmlIndex = lines.findIndex(line => line.match(/<html\s+(.+\s+)?lang=[^\s>]+(\s|>)/))

    if (htmlIndex !== -1) {
      lines[htmlIndex] = lines[htmlIndex].replace(/(<html\s+(.+\s+)?)(lang=)([^\s>]+)(\s|>)/, `$1$3"${locale}"$5`)
    }

    return lines
  })
}

module.exports = {
  addDependencies,
  addImports,
  renderFiles,
  setHtmlLang,
}
