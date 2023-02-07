const importModule = require("@babel/helper-module-imports")
const { declare } = require('@babel/helper-plugin-utils');

const autoTrackPlugin = declare((api, option, dirname) => {
    api.assertVersion(7);
    return {
        visitor: {
            Program: {
                enter(path, state) {
                    path.traverse({
                        ImportDeclaration(curPath) {
                            const requirePath = curPath.get("source").node.value
                            if (requirePath === option.trackerPath) { // 如果已经引入了
                                const specifierPath = curPath.get('specifiers.0');
                                // 处理default import 和 namespace import
                                if (specifierPath.isImportSpecifier()) {
                                    state.trackerImportId = specifierPath.toString();
                                } else if (specifierPath.isImportNamespaceSpecifier()) {
                                    state.trackerImportId = specifierPath.get('local').toString();// tracker 模块的 id
                                }
                                path.stop();// 找到了就终止遍历
                            }
                        }
                    })
                    if (!state.trackerImportId) {
                        const  trackerName =  option.trackerPath
                        state.trackerImportId = importModule.addDefault(path, trackerName, {
                            nameHint: path.scope.generateUid(trackerName)
                        }).name; // tracker 模块的 id
                        state.trackerAST = api.template.statement(`${state.trackerImportId}()`)();// 埋点代码的 AST
                    }
                }
            },
            'ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration'(path, state) {
                const bodyPath = path.get('body');
                if (bodyPath.isBlockStatement()) {
                    bodyPath.node.body.unshift(state.trackerAST);
                } else {
                    const ast = api.template.statement(`{${state.trackerImportId}();return PREV_BODY;}`)({ PREV_BODY: bodyPath.node });
                    bodyPath.replaceWith(ast);
                }
            }
        }
    }
})





module.exports = autoTrackPlugin;