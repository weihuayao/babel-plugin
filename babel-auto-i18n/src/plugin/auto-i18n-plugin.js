const {declare} = require("@babel/helper-plugin-utils")
const path = require('path')
const fse = require('fs-extra')
const generate = require('@babel/generator').default;
let intlIndex = 0;
function nextIntlKey() {
    ++intlIndex;
    return `intl${intlIndex}`;
}


function save(file, key, value) {
    const allText = file.get('allText');
    allText.push({
        key, value
    });
    file.set('allText', allText);
}
const autoTrackPlugin = declare((api, options, dirname) => {
    api.assertVersion(7)

    if (!options.outputDir) {
        throw new Error('outputDir in empty');
    }

//生成替换节点
    function getReplaceExpression(path, value, intlUid) {
        const expressionParams = path.isTemplateLiteral() ? path.node.expressions.map(item => generate(item).code) : null
        let replaceExpression = api.template.ast(`${intlUid}.t('${value}'${expressionParams ? ',' + expressionParams.join(',') : ''})`).expression;
        if (path.findParent(p => p.isJSXAttribute()) && !path.findParent(p=> p.isJSXExpressionContainer())) {
            replaceExpression = api.types.JSXExpressionContainer(replaceExpression);
        }
        return replaceExpression;
    }

    function save(file, key, value) {
        const allText = file.get('allText');
        allText.push({
            key, value
        });
        file.set('allText', allText);
    }

    return{
        prefix(file){

        },
        visitor:{
            Program:{
                enter(path,state){
                    // 引入了 intl 就不引入 反之则自动导入
                    let imported;
                    path.traverse({
                        ImportDeclaration(p){
                            const source = p.node.source.value
                            if (source === 'intl'){
                                imported = true
                            }
                        }
                    })
                    if (!imported){
                        const uid = path.scope.generateUid('intl')
                        const importAst = api.template.ast(`import ${uid} form 'intl'`)
                        path.node.body.unshift(importAst)
                        state.intlUid = uid
                    }
                    // 对所有的有 /*i18n-disable*/ 注释的字符串和模版字符串节点打个标记，用于之后跳过处理。然后把这个注释节点从 ast 中去掉。
                    path.traverse({
                        'StringLiteral|TemplateLiteral'(path){
                            if (path.node.leadingComments){
                                path.node.leadingComments = path.node.leadingComments.filter((comment,index)=>{
                                    if (comment.value.includes('i18n-disable')){
                                        path.node.skipTransfrom = true
                                        return false
                                    }
                                    return  true
                                })
                            }
                            if (path.findParent(p=>p.isImportDeclaration())){
                                path.node.skipTransfrom = true
                            }
                        }
                    })
                }
            }
        },
        StringLiteral(path,state){
            if (path.node.skipTransfrom){
                return
            }
            let key = nextIntlKey()
            save(state.file,key,path.node.value)
            const  replaceExpression =getReplaceExpression(path,key ,state.intlUid)
            path.replace(replaceExpression)
            path.skip()
        },

        post(file){
            const allText = file.get('allText');
            const intlData = allText.reduce((obj, item) => {
                obj[item.key] = item.value;
                return obj;
            }, {});

            const content = `const resource = ${JSON.stringify(intlData, null, 4)};\nexport default resource;`;
            fse.ensureDirSync(options.outputDir);
            fse.writeFileSync(path.join(options.outputDir, 'zh_CN.js'), content);
            fse.writeFileSync(path.join(options.outputDir, 'en_US.js'), content);
        }
    }
})

module.exports = autoTrackPlugin
