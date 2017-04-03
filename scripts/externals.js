/* eslint-env node */

const fs = require('fs');
const url = require('url');
const path = require('path');

const readJSON = (uri) => JSON.parse(fs.readFileSync(path.resolve(__dirname, uri)));

const isProduction = () => process.env == 'production';

const readPackageMeta = (pkg) => {
  let metadata;
  try {
    metadata = require(`${pkg}/package.json`);
  } catch (e) {
    throw new Error(`Error reading "${pkg}", please ensure it's installed and readable`);
  }
  return metadata;
};

const final_url = (path, name, version, ext = '') => {
  const uri = path.replace(/\{name\}/g, name)
                  .replace(/\{version\}/g, version)
                  .replace(/\{ext\}/g, ext);
  return url.resolve(uri);
};

const cache = {
  cdn: null,
  config: null,
  package: null,
  resmap: null,
  resmap_param: null,
};

const reload = () => {
  cache.cdn = readJSON('../config/cdn.json');
  cache.config = readJSON('../config/externals.json');
  cache.package = readJSON('../package.json');
  cache.resmap = null;
  cache.resmap_param = null;
};

reload();

const getResourceMap = (prefer_local = true) => {
  if (cache.resmap && cache.resmap_param == prefer_local) {
    return cache.resmap;
  }

  const cdn_prefix = cache.cdn.host + cache.cdn.prefix;
  const dependencies = Object.assign({}, cache.package.devDependencies, cache.package.dependencies);

  const result = [];
  Object.keys(cache.config).forEach(name => {
    if (!dependencies.hasOwnProperty(name)) {
      process.stderr.write(`Package "${name}" is not defined, ignored\n`);
      return;
    }

    const metadata = readPackageMeta(name);
    const data = {
      name,
      version: metadata.version,
      css: [],
      js: [],
    };

    if (isProduction() || !prefer_local) {
      if (!cache.cdn.libraries.hasOwnProperty(name)) {
        throw new Error(`Package "${name}" is not defined in "config/cdn.json"`);
      }

      const cdn_data = cache.cdn.libraries[name];
      if (!cdn_data) {
        data.css.push(final_url(cdn_prefix + cache.cdn.default, name, metadata.version, 'css'));
        data.js.push(final_url(cdn_prefix + cache.cdn.default, name, metadata.version, 'js'));

      } else if (typeof cdn_data == 'string' || Array.isArray(cdn_data)) {
        const array = Array.isArray(cdn_data) ? cdn_data : [cdn_data];
        for (let uri of array) {
          if (uri.endsWith('.css')) {
            data.css.push(final_url(cdn_prefix + uri, name, metadata.version, 'css'));
          } else {
            data.js.push(final_url(cdn_prefix + uri, name, metadata.version, 'js'));
          }
        }

      } else {
        const styles = Array.isArray(cdn_data.css) ? cdn_data.css : [cdn_data.css];
        for (let uri of styles) {
          data.css.push(final_url(cdn_prefix + uri, name, metadata.version, 'css'));
        }

        const scripts = Array.isArray(cdn_data.js) ? cdn_data.js : [cdn_data.js];
        for (let uri of scripts) {
          data.js.push(final_url(cdn_prefix + uri, name, metadata.version, 'js'));
        }
      }

    } else {
      if (metadata.style) {
        data.css.push(url.resolve(`/node_modules/${name}/`, metadata.style));
      } else if (metadata.main && metadata.main.endsWith('.css')) {
        data.css.push(url.resolve(`/node_modules/${name}/`, metadata.main));
      } else if (fs.existsSync(path.resolve(`../node_modules/${name}/index.css`))) {
        data.css.push(`/node_modules/${name}/index.css`);
      }

      if (metadata.browser) {
        if (typeof metadata.browser == 'string') {
          data.js.push(url.resolve(`/node_modules/${name}/`, metadata.browser));
        } else {
          Object.values(metadata.browser).each(v => {
            if (v) data.js.push(url.resolve(`/node_modules/${name}/`, v));
          });
        }
      } else if (metadata.main && metadata.main.endsWith('.js')) {
        data.js.push(url.resolve(`/node_modules/${name}/`, metadata.main));
      } else if (fs.existsSync(path.resolve(`../node_modules/${name}/index.js`))) {
        data.js.push(`/node_modules/${name}/index.js`);
      }

      if (data.css.length == 0 && data.js.length == 0) {
        throw new Error(`No resource detected for package "${name}"`);
      }
    }

    result.push(data);
  });

  cache.resmap = result;
  cache.resmap_param = prefer_local;
  return result;
};

module.exports = {
  reload,
  getResourceMap,
  getExternals: () => cache.config,
  getCDNConfig: () => cache.cdn,
};
