/**
 * plugins/app.js
 *
 * Automatically loads and bootstraps files
 * in the `./src/components/` folder.
 */

import Vue from 'vue'

// Automatically get all .vue files within
// `src/components` and register them to
// the current app.
// https://webpack.js.org/guides/dependency-management/#requirecontext
const requireComponent = require.context('@/components', true, /\.vue$/)
for (const file of requireComponent.keys()) {
  const componentConfig = requireComponent(file)

  Vue.component(
    componentConfig.default.name,
    componentConfig.default || componentConfig,
  )
}
