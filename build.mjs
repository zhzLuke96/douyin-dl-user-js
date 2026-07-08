#!/usr/bin/env node
import * as esbuild from "esbuild"
import { readFileSync } from "fs"

const args = process.argv.slice(2)
const isWatch = args.includes("--watch")
const isMinify = args.includes("--minify")

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"))

const USERSCRIPT_HEADER = `// ==UserScript==
// @name            抖音下载
// @namespace       https://github.com/zhzLuke96/douyin-dl-user-js
// @version         ${pkg.version}
// @description     为web版抖音增加下载按钮
// @author          zhzluke96
// @match           https://*.douyin.com/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=douyin.com
// @license         MIT
// @supportURL      https://github.com/zhzLuke96/douyin-dl-user-js/issues
// @downloadURL     https://update.greasyfork.org/scripts/522326/%E6%8A%96%E9%9F%B3%E4%B8%8B%E8%BD%BD.user.js
// @updateURL       https://update.greasyfork.org/scripts/522326/%E6%8A%96%E9%9F%B3%E4%B8%8B%E8%BD%BD.meta.js
// @grant           GM_xmlhttpRequest
// @connect         *
// ==/UserScript==

`

/** @type {esbuild.BuildOptions} */
const config = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/dy-dl.user.js",
  format: "iife",
  target: "es2020",
  banner: { js: USERSCRIPT_HEADER },
  keepNames: true,
  minifySyntax: isMinify,
  minifyWhitespace: isMinify,
  define: {
    "process.env.NODE_ENV": isMinify ? '"production"' : '"development"',
  },
}

if (isWatch) {
  const ctx = await esbuild.context(config)
  await ctx.watch()
  console.log("[esbuild] watching for changes...")
} else {
  await esbuild.build(config)
  console.log("[esbuild] build complete -> dist/dy-dl.user.js")
}