/*
 * @Descripttion: babel插件
 * @Author: wayde
 * @Date: 2023-01-11 10:03:34
 */
// 遗留问题 上面那个注释 去除log
const generate = require('@babel/generator').default;

const targetCalleeName = ['info','log','error','debug'].map(item => `console.${item}`)

module.exports=function({types,template}){
        return{
            visitor:{
                CallExpression(path,state){
                    if(path.node.isNew){ // 新增节点需要跳过 不然会反复遍历
                        return
                    }
                    const calleeName = generate(path.node.callee).code //将代码转为字符串简化判断条件
                    if(targetCalleeName.includes(calleeName)){ // 简化写法
                        const {line , column} = path.node.loc.start
                        //添加新的node
                        const newNode = template.expression(`console.log("filename: (${line}, ${column})")`)()
                        newNode.isNew = true
                        if(path.findParent(path => path.isJSXElement())){ //处理jsx语法
                            path.replaceWith(types.arrayExpression([newNode,path.node]))
                            path.skip()
                        }else{
                            path.insertBefore(newNode)
                        }
                    }
                    
                }
            }
        }
    }

