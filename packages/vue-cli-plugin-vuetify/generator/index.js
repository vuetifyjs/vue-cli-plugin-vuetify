module.exports = (api, opts) => {
  const alaCarte = require('./tools/alaCarte')
  const fonts = require('./tools/fonts')
  const polyfill = require('./tools/polyfill')
  const vite = require('./tools/vite')
  const vuetify = require('./tools/vuetify')

  const fs = require('fs')

  if (opts.preset !== 'configure') {
    opts = require(`../presets/${opts.preset}`).plugins['vue-cli-plugin-vuetify']
  }

  // Add imports
  // Must be before dependencies because of weird bug
  if (!opts.useV3) vuetify.addImports(api)
  if (!opts.useAlaCarte && opts.usePolyfill) polyfill.addImports(api)
  if (opts.installFonts) opts.useV3 ? fonts.addPlugin(api, opts) : fonts.addImports(api, opts.iconFont)

  // Add dependencies
  vuetify.addDependencies(api, opts.useV3)
  if (opts.useAlaCarte) alaCarte.addDependencies(api, opts.useV3)
  else if (opts.usePolyfill) polyfill.addDependencies(api)

  // Vite
  if (opts.useVite) {
    vite.addDependencies(api)
    vite.renderFiles(api, opts)
  }

  if (opts.installFonts) fonts.addDependencies(api, opts.iconFont)

  // Update vue.config.js for transpileDependency if AlaCarte
  if (opts.useAlaCarte) alaCarte.addVueConfigTranspileDependency(api)

  // Update templates
  vuetify.renderFiles(api, { opts })

  // adapted from https://github.com/Akryum/vue-cli-plugin-apollo/blob/master/generator/index.js#L68-L91
  api.onCreateComplete(() => {
    if (!opts.useAlaCarte && opts.usePolyfill) {
      polyfill.updateBabelConfig(api)
      polyfill.updateBrowsersList(api)
    }
    if (!opts.installFonts) fonts.addLinks(api, opts.iconFont)
    vuetify.setHtmlLang(api, opts.locale)

    if (fs.existsSync('src/public/index.html')) {
      fs.unlinkSync(api.resolve('src/public/index.html'))
    }

    api.exitLog('Discord community: https://community.vuetifyjs.com')
    api.exitLog('Github: https://github.com/vuetifyjs/vuetify')
    api.exitLog('Support Vuetify: https://github.com/sponsors/johnleider')
  })
}
