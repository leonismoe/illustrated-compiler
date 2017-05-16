/* eslint-env node */

const fs = require('fs');
const path = require('path');
const NormalModule = require('webpack/lib/NormalModule');
const externals = require('../externals').getExternals();
const postcssIntegration = require('../postcss/imported');

function ExternalsPlugin(options) {
  this.options = options || {};
}

ExternalsPlugin.prototype.apply = function(compiler) {

  compiler.plugin('emit', (compilation, callback) => {
    const map = require('../externals').getResourceMap();
    const webpackFS = compilation.compiler.outputFileSystem && compilation.compiler.outputFileSystem.existsSync ? compilation.compiler.outputFileSystem : fs;

    for (let k in compilation.entrypoints) {
      if (!compilation.entrypoints.hasOwnProperty(k)) continue;
      const entrypoint = compilation.entrypoints[k];
      for (let chunk of entrypoint.chunks) {
        ;
      }

    }

    const imported_styles = [];
    const extra_styles = [];
    postcssIntegration.get().forEach(v => {
      if (v.startsWith('~')) v = v.slice(1);
      const parts = v.split('/');
      const id = parts[0];
      if (!externals[id]) return false;
      if (parts.length > 1) {
        if (!v.endsWith('.css')) v += '.css';
        extra_styles.push('/node_modules/' + v);
      } else {
        imported_styles.push(id);
      }
    });

    const externals_modules = [];
    for (let module of compilation.modules) {
      if (module.rawRequest && /^\w/.test(module.rawRequest) && !module.issuer.context.includes('node_modules')) {
        const parts = module.rawRequest.split('/');
        const id = parts[0];
        if (externals[id]) {
          externals_modules.push(module.rawRequest);
        }
      }
    }

    const imported_modules = Object.keys(externals);
    const extra_scripts = [];
    // console.log(compilation.options);

    const entries = ((entry) => {
      if (typeof entry == 'function') {
        entry = entry();
      }
      if (typeof entry == 'string') {
        return [
          {
            name: path.basename(entry).slice(0, path.extname(entry).length),
            base: path.dirname(entry),
            file: path.basename(entry),
          }
        ];
      }
      if (Array.isArray(entry)) {
        return entry.map(v => ({
          name: path.basename(v).slice(0, path.extname(v).length),
          base: path.dirname(v),
          file: path.basename(v),
        }));
      }
      if (Object.getPrototypeOf(entry) == Object.prototype) {
        return Object.entries(entry).map(([k, v]) => ({
          name: k,
          base: typeof v == 'string' ? path.dirname(v) : '.',
          file: typeof v == 'string' ? path.basename(v) : v,
        }));
      }
      return [];
    })(compilation.options.entry);

    const root = path.resolve(__dirname, '../../');
    const context = compilation.options.context;
    const dest = compilation.options.output.path;
    const pathns = compilation.options.output.publicPath ? path.dirname(compilation.options.output.publicPath) + '/' : '';

    const pattern_styles  = '<!-- inject external styles -->';
    const pattern_scripts = '<!-- inject external scripts -->';

    if (!webpackFS.existsSync(dest)) {
      if (webpackFS.mkdirpSync) {
        webpackFS.mkdirpSync(dest);
      } else {
        require('mkdirp').sync(dest);
      }
    }

    let counter = 0;
    for (let { name, base, file } of entries) {
      fs.readFile(`${context}/${base}/${name}.html`, 'utf-8', (err, data) => {
        if (err) {
          process.stdout.write(`Could not read ${path.relative(root, context + '/' + base).replace(/\\/g, '/')}/${name}.html\n${err.message}\n`);
          if (++counter == entries.length) {
            postcssIntegration.empty();
            callback();
          }
          return;
        }

        data = data.replace(pattern_styles, () => {
          let styles = [];
          for (let v of map) {
            const pkg = v.name;
            if (imported_styles.includes(pkg) || imported_modules.includes(pkg)) {
              styles = styles.concat(v.css);
            }
          }
          styles = styles.concat(extra_styles);
          return styles.map(v => `<link rel="stylesheet" type="text/css" href="${v}">`).join('\n');
        });

        data = data.replace(pattern_scripts, () => {
          let scripts = [];
          for (let v of map) {
            const pkg = v.name;
            if (imported_modules.includes(pkg)) {
              scripts = scripts.concat(v.js);
            }
          }
          scripts = scripts.concat(extra_scripts);
          return scripts.map(v => `<script type="text/javascript" src="${v}"></script>`).join('\n');
        });

        webpackFS.writeFile(`${dest}/${name}.html`, data, (err) => {
          if (err) {
            process.stdout.write(`Write file ${name}.html failed.\n${err.message}\n`);
          }
          if (++counter == entries.length) {
            postcssIntegration.empty();
            callback();
          }
        });

      });
    }

  });

};

module.exports = ExternalsPlugin;
