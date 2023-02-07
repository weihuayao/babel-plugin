/*
 * @Descripttion: 
 * @Author: wayde
 * @Date: 2023-02-07 15:40:53
 */
const { transformFromAstSync } = require('@babel/core');
const  parser = require('@babel/parser');
const autoTrackPlugin = require('./plugin/auto-track-plugin');
const fs = require('fs');
const path = require('path');
const  trackTest = require('./trackTest') 
const sourceCode = fs.readFileSync(path.join(__dirname, './sourceCode.js'), {
    encoding: 'utf-8'
});

const ast = parser.parse(sourceCode, {
    sourceType: 'unambiguous'
});
trackTest()
const { code } = transformFromAstSync(ast, sourceCode, {
    plugins: [[autoTrackPlugin, {
        trackerPath: 'trackTest'
    }]]
});

console.log(code);