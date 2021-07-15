const helpers = require('./helpers')
const fonts = {
  mdi: {
    package: {
      '@mdi/font': '5.9.55',
    },
    import: '@mdi/font/css/materialdesignicons.css',
    link:
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@latest/css/materialdesignicons.min.css">',
  },
  md: {
    package: {
      'material-design-icons-iconfont': '6.1.0',
    },
    import: 'material-design-icons-iconfont/dist/material-design-icons.css',
    link:
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons">',
  },
  fa: {
    package: {
      '@fortawesome/fontawesome-free': '5.15.3',
    },
    import: '@fortawesome/fontawesome-free/css/all.css',
    link:
      '<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css" integrity="sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ" crossorigin="anonymous">',
  },
  fa4: {
    package: {
      'font-awesome': '4.7.0',
    },
    import: 'font-awesome/css/font-awesome.css',
    link:
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css">',
  },
  roboto: {
    package: {
      'roboto-fontface': '*',
    },
    import: 'roboto-fontface/css/roboto/roboto-fontface.css',
    link:
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900">',
  },
}

function addDependencies (api, iconFont) {
  api.extendPackage({
    dependencies: {
      ...fonts.roboto.package,
      ...fonts[iconFont].package,
    },
  })
}

function addImports (api, iconFont) {
  api.injectImports(api.entryFile, `import '${fonts.roboto.import}'`)
  api.injectImports(api.entryFile, `import '${fonts[iconFont].import}'`)
}

function addLinks (api, iconFont) {
  helpers.updateFile(api, './public/index.html', lines => {
    const lastLink = lines.reverse().findIndex(line => line.match(/^\s*<\/head>/))

    lines.splice(lastLink + 1, 0, `    ${fonts.roboto.link}`)
    lines.splice(lastLink + 1, 0, `    ${fonts[iconFont].link}`)

    return lines.reverse()
  })
}

function addPlugin(api, opts) {
  opts.hasTS = api.hasPlugin('typescript')
  const ext = opts.hasTS ? 'ts' : 'js'

  api.injectImports(api.entryFile, `import { loadFonts } from './plugins/webfontloader'`)
  
  api.extendPackage({
    dependencies: {
      'webfontloader': '^1.0.0',
    },
  })

  api.render({
    [`./src/plugins/webfontloader.${ext}`]: `../templates/v3/vite/plugins/webfontloader.${ext}`,
  }, opts)
}

module.exports = {
  addDependencies,
  addImports,
  addLinks,
  addPlugin,
}
