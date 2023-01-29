/*
 * @Descripttion: 
 * @Author: wayde
 * @Date: 2023-01-11 10:03:34
 */
const parser = require('@babel/parser')
const traverse = require("@babel/traverse").default
const generate = require('@babel/generator').default;
const types = require('@babel/types')
const template = require('@babel/template').default
// 源代码
const sourceCode = `
    console.log(1);

    function func() {
        console.info(2);
    }

    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
`;
// ast 
const ast  = parser.parse(sourceCode,{
    sourceType:'unambiguous',
    plugins:['jsx']
})
const targetCalleeName = ['info','log','error','debug'].map(item => `console.${item}`)

// 遍历
traverse(ast,{
    CallExpression(path,state){
        if(path.node.isNew){ // 新增节点需要跳过 不然会反复遍历
            return
        }
        // const calleeName = generator(path.node.callee).code //将代码转为字符串简化判断条件
        const calleeName = generate(path.node.callee).code;
        // if(types.isMemberExpression(path.node.callee)
        // && path.node.callee.object.name === 'console' 
        // && ['info','log','error','debug'].includes(path.node.callee.property.name)){
        //     const {line , column} = path.node.loc.start
        //     path.node.arguments.unshift(types.stringLiteral(`filename: (${line}, ${column})`))
        // }
        if(targetCalleeName.includes(calleeName)){ // 简化写法
            const {line , column} = path.node.loc.start
            const newNode = template.expression(`console.log("filename: (${line}, ${column})")`)()
            newNode.isNew = true
            if(path.findParent(path =>path.isJSXElement())){ //处理jsx
                path.replaceWith(types.arrayExpression([newNode,path.node]))
                path.skip()
            }else{
                path.insertBefore(newNode)
            }
        }
        
    }
})

const {code,map} = generate(ast)
console.log(code);