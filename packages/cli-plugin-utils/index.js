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

function generatePreset (api, preset, onCreateComplete) {
  if (!api.hasPlugin('vuetify')) {
    console.error('Vuetify presets require the `vue-cli-plugin-vuetify` package.')

    return
  }

  const file = getPluginFileName(api)
  const plugin = api.resolve(file)

  if (!fs.existsSync(plugin)) {
    const fileSeparatorIndex = file.lastIndexOf('/')
    const fileName = file.substr(fileSeparatorIndex + 1)
    const filePath = file.substr(0, fileSeparatorIndex);
    console.warn(`Unable to locate \`${fileName}\` plugin file in \`${filePath}\`.`)

    return
  }

  api.injectImports(file, `import { preset } from ${preset}`)

  api.onCreateComplete(() => {
    updateVuetifyObject(api, 'preset')

    typeof onCreateComplete === 'function' && onCreateComplete()
  })
}

// Returns the path to the vuetify plugin file, adjusting if typescript is added
function getPluginFileName(api) {
  const extension = api.hasPlugin('typescript') ? 'ts' : 'js'
  return `src/plugins/vuetify.${extension}`
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
  else opt.prependData = variables

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
  const pluginFile = getPluginFileName(api)
  updateFile(api, pluginFile, content => {
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
      console.warn(`Unable to locate Vuetify instantiation in \`${pluginFile}\`.`)

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
function VuetifyPresetService (api, preset) {
  injectSassVariables(api, `~vue-cli-plugin-vuetify-preset-${preset}/preset/variables.scss`)
}

function VuetifyPresetGenerator (api, preset, onCreateComplete) {
  generatePreset(api, `'vue-cli-plugin-vuetify-preset-${preset}/preset'`, onCreateComplete)
}

module.exports = {
  fileExists,
  generatePreset,
  getPluginFileName,
  injectGoogleFontLink,
  injectHtmlLink,
  injectSassVariables,
  mergeSassVariables,
  updateFile,
  updateVuetifyObject,
  VuetifyPresetGenerator,
  VuetifyPresetService,
}
