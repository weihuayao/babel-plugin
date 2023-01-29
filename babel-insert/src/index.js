/*
 * @Descripttion: 
 * @Author: wayde
 * @Date: 2023-01-12 14:04:15
 */
// liu
const {transformFileSync} = require("@babel/core")
const insertParametersPlugin  = require("./plugin/insert-log-plugin")
const path = require('path');
const {code} = transformFileSync(path.join(__dirname,'./sourceCode.js'),{
    plugins:[insertParametersPlugin],
    parserOpts:{
        sourceType:'unambiguous',
        plugins:['jsx']
    }
})

console.log(code);
