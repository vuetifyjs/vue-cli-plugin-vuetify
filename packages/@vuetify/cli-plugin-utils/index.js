// Utilities
const semver = require('semver')
const fs = require('fs')

// Injects a <link> element into ./public/index.html
function injectHtmlLink (api, href, attrs) {
  updateFile(api, './public/index.html', lines => {
    const lastLink = lines.reverse().findIndex(line => line.match(/^\s*<\/head>/))
    const link = `<link ${attrs} href="${href}">`

    if (lines.join('').indexOf(link) > -1) {
      return lines.reverse()
    }

    lines.splice(lastLink + 1, 0, `    ${link}`)

    return lines.reverse()
  })
}

// Injects a font <link> into ./public/index.html
function injectGoogleFontLink (api, font) {
  font = !Array.isArray(font) ? [font] : font

  const url = font.map(str => {
    const {
      family = str,
      weights = '100,300,400,500,700,900',
    } = str.split(':')

    return `${family}:${weights}`
  }).join('|')

  return injectHtmlLink(api, `https://fonts.googleapis.com/css?family=${url}&display=swap`, 'rel="stylesheet"')
}

// Injects target SASS variables file
function injectSassVariables (
  api,
  file,
  modules = ['vue-modules', 'vue', 'normal-modules', 'normal'],
) {
  api.chainWebpack(config => {
    modules.forEach(match => {
      for (let i = 0; i < 2; i++) {
        const boolean = Boolean(i)
        const rule = boolean ? 'sass' : 'scss'
        const end = boolean ? "'" : "';"

        config.module
          .rule(rule)
          .oneOf(match)
          .use('sass-loader')
          .tap(opt => mergeSassVariables(opt, `'${file}${end}`))
      }
    })
  })
}

function generatePreset (api, onCreateComplete) {
  if (!api.hasPlugin('vuetify')) {
    console.error('Vuetify presets require the `vue-cli-plugin-vuetify` package.')

    return
  }

  const ext = api.hasPlugin('typescript') ? 'ts' : 'js'
  const file = `src/plugins/vuetify.${ext}`
  const plugin = api.resolve(file)

  if (!fs.existsSync(plugin)) {
    console.warn(`Unable to locate 'vuetify.${ext}' plugin file in 'src/plugins'.`)

    return
  }

  api.injectImports(file, `import { preset } from '${api.id}/preset'`)

  api.onCreateComplete(() => {
    updateVuetifyObject(api, 'preset')

    typeof onCreateComplete === 'function' && onCreateComplete()
  })
}

// Check if file exists in user project
function fileExists (api, file) {
  return fs.existsSync(api.resolve(file))
}

// Create an import statement
// to bootstrap a users variables
function mergeSassVariables (opt, file) {
  const variables = `@import ${file}`

  let sassLoaderVersion
  try {
    sassLoaderVersion = semver.major(require('sass-loader/package.json').version)
  } catch (e) {}

  // Merge with user-defined loader data config
  if (sassLoaderVersion < 8) opt.data = variables
  else if (sassLoaderVersion < 9) opt.prependData = variables
  else opt.additionalData = variables

  return opt
}

// Update local file with supplied callback
function updateFile (api, file, callback) {
  const { EOL } = require('os')
  file = api.resolve(file)
  let content = fs.existsSync(file)
    ? fs.readFileSync(file, { encoding: 'utf8' })
    : ''

  content = callback(content.split(/\r?\n/g)).join(EOL)

  fs.writeFileSync(file, content, { encoding: 'utf-8' })
}

// Add new property to the Vuetify object
function updateVuetifyObject (api, value) {
  const ext = api.hasPlugin('typescript') ? 'ts' : 'js'
  
  updateFile(api, `src/plugins/vuetify.${ext}`, content => {
    const existingValue = str => (
      str.indexOf(`${value},`) > -1 ||
      str.indexOf(`${value}:`) > -1
    )

    // If content already exists, skip update
    if (content.find(existingValue)) {
      return content
    }

    const index = content.findIndex(str => {
      return str.indexOf('new Vuetify(') > -1
    })
    const vuetify = content[index]

    if (!vuetify) {
      console.warn(`Unable to locate Vuetify instantiation in 'src/plugins/vuetify.${ext}'.`)

      return
    }

    const optionsStartIndex = vuetify.indexOf('({')
    const optionsStopIndex = vuetify.indexOf('})')
    const hasMultilineObject = optionsStartIndex > -1
    const hasInlineObject = (
      hasMultilineObject &&
      optionsStopIndex > -1
    )

    // new Vuetify({ ... })
    if (hasInlineObject) {
      const start = vuetify.slice(0, optionsStartIndex + 2)
      const stop = vuetify.slice(optionsStartIndex + 2)

      content[index] = `${start} ${value} ${stop}`
    // new Vuetify({
    //   ...
    // })
    } else if (hasMultilineObject) {
      content.splice(index + 1, 0, `  ${value},`)
    // new Vuetify()
    } else {
      const vuetifyStartIndex = vuetify.indexOf('(')
      const start = vuetify.slice(0, vuetifyStartIndex + 2)

      content[index] = `${start}{ ${value} })`
    }
    // TODO: Handle new Vuetify(options) - user options being passed

    return content
  })
}

// Helper functions for Vuetify presets
function VuetifyPresetService (api) {
  injectSassVariables(api, `~${api.id}/preset/variables.scss`)
}

function VuetifyPresetGenerator (api, onCreateComplete) {
  generatePreset(api, onCreateComplete)
}

module.exports = {
  fileExists,
  generatePreset,
  injectGoogleFontLink,
  injectHtmlLink,
  injectSassVariables,
  mergeSassVariables,
  updateFile,
  updateVuetifyObject,
  VuetifyPresetGenerator,
  VuetifyPresetService,
}
