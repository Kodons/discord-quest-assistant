/**
 * Zero-dependency Project Bundler
 * Menggabungkan seluruh modular file di src/ menjadi satu file mandiri (skip_quest_dc.js)
 */
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.resolve(__dirname, "src");
const OUTPUT_FILE = path.resolve(__dirname, "skip_quest_dc.js");
const DIST_DIR = path.resolve(__dirname, "dist");
const DIST_FILE = path.resolve(DIST_DIR, "skip_quest_dc.bundle.js");

function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, fileList);
        } else if (file.endsWith(".js")) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

function normalizeKey(filePath) {
    let rel = path.relative(SRC_DIR, filePath).replace(/\\/g, "/");
    if (rel.endsWith(".js")) {
        rel = rel.slice(0, -3);
    }
    return "./" + rel;
}

function build() {
    console.log("[Build] Memulai proses bundling...");
    const files = getAllFiles(SRC_DIR);
    console.log(`[Build] Ditemukan ${files.length} file di ${SRC_DIR}`);

    const moduleEntries = [];

    for (const file of files) {
        const key = normalizeKey(file);
        const code = fs.readFileSync(file, "utf8");
        moduleEntries.push(`
  // --- Module: ${key} ---
  "${key}": function(require, module, exports) {
${code}
  }`);
    }

    const bundleContent = `/**
 * Discord Quest Auto-Completer & Bypass Tool (Bundled)
 * Generated at: ${new Date().toISOString()}
 * Source modules: ${files.length} files from src/
 */
(function () {
  "use strict";

  var __modules = {${moduleEntries.join(",\n")}
  };

  var __cache = {};

  function __normalizePath(base, relative) {
    if (!relative.startsWith(".")) return relative;
    var cleanBase = base.startsWith("./") ? base.slice(2) : base;
    var stack = cleanBase.split("/").filter(function(x) { return x && x !== "."; });
    stack.pop(); // remove current file name
    var parts = relative.split("/");
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part === "." || part === "") continue;
      if (part === "..") {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(part);
      }
    }
    var res = stack.join("/");
    if (res.endsWith(".js")) res = res.slice(0, -3);
    return "./" + res;
  }

  function __require(name, currentModule) {
    var resolved = __normalizePath(currentModule || "./entry", name);
    if (__cache[resolved]) {
      return __cache[resolved].exports;
    }

    var cleanName = resolved.indexOf("./") === 0 ? resolved.slice(2) : resolved;
    var modFn = __modules[resolved] || __modules[resolved + ".js"] || __modules[cleanName] || __modules[cleanName + ".js"];
    if (!modFn) {
      throw new Error("Module not found: " + name + " (resolved as: " + resolved + ")");
    }

    var module = { exports: {} };
    __cache[resolved] = module;

    function localRequire(reqPath) {
      return __require(reqPath, resolved);
    }

    modFn(localRequire, module, module.exports);
    return module.exports;
  }

  // Jalankan entry point src/index.js
  __require("./index", "./entry");
})();
`;

    // Tulis ke skip_quest_dc.js di root
    fs.writeFileSync(OUTPUT_FILE, bundleContent, "utf8");
    console.log(`[Build] Berhasil membuat file root: ${OUTPUT_FILE}`);

    // Tulis juga ke folder dist/
    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    }
    fs.writeFileSync(DIST_FILE, bundleContent, "utf8");
    console.log(`[Build] Berhasil membuat file dist: ${DIST_FILE}`);

    console.log("[Build] Bundling selesai dengan sukses! ✨");
}

build();
