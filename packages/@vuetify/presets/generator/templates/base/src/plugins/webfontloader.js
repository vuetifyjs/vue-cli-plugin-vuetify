/**
 * plugins/webfontloader.js
 *
 * The webfontloader provides a common interface
 * for loading fonts regardless of the source.
 *
 * webfontloader documentation: https://github.com/typekit/webfontloader
 */

 // Imports
import WebFontLoader from 'webfontloader'

WebFontLoader.load({
  google: {
    families: ['Roboto:100,300,400,500,700,900&display=swap'],
  },
  custom: {
    urls: ['https://cdn.jsdelivr.net/npm/@mdi/font@5.x/css/materialdesignicons.min.css'],
    timeout: 2000,
  },
})
