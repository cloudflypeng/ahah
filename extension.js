const vscode = require('vscode');
const oxc = require('oxc-parser');

let outputChannel;
const getFileContent = (document) => {
	try {
		content = document.getText();
		outputChannel.appendLine(`文件内容长度: ${content.length}`);
		outputChannel.appendLine('文件内容开始 >>>');
		outputChannel.appendLine(typeof content);
		outputChannel.appendLine('<<< 文件内容结束');
		return content;

	} catch (e) {
		outputChannel.appendLine(`获取文档内容失败: ${e.message}`);
		return ''
	}
}

// 生成装饰器
function getDecoration(icon) {
	return vscode.window.createTextEditorDecorationType({
		before: {
			contentText: icon,
			margin: '0 0.2em 0 0'
		}
	});
}

const DECORATION_MAP = {
	'store': '🏪',
	'ref': '🔗',
	'computed': '🔄',
	'watch': '👀',
}
const MATCH_VAR = {
	'ref': [],
	'computed': [],
	'storeValue': []
}
// ast 相关变量
const ast_map = {
	'VariableDeclaration': 'VariableDeclaration',
}

// 监听文件打开事件
const fileOpenListener = vscode.window.onDidChangeActiveTextEditor(editor => {
	outputChannel.appendLine('文件被打开');
	if (editor) {
		outputChannel.appendLine(`文件类型: ${editor.document.languageId}`);
		const document = editor.document;
		const isJsFile = ['javascript', 'typescript', 'javascriptreact'].includes(document.languageId);

		if (isJsFile) {
			outputChannel.appendLine('执行装饰器命令');
			vscode.commands.executeCommand('ahah.addDecoration');
		}
	}
});

async function activate(context) {
	// 创建输出通道
	outputChannel = vscode.window.createOutputChannel('Meancode');

	await init()
	console.log('pyf-激活了', Object.keys(oxc))
	// 生成装饰器
	const dec_map = new Map();

	// 确保所有装饰器都被正确创建和订阅
	try {
		for (const [key, value] of Object.entries(DECORATION_MAP)) {
			const decoration = getDecoration(value);
			dec_map.set(key, decoration);
			// 将装饰器添加到订阅中
			context.subscriptions.push(decoration);
		}
	} catch (error) {
		console.error('创建装饰器失败:', error);
	}

	const addDecoration = vscode.commands.registerCommand('ahah.addDecoration', (uri) => {
		outputChannel.appendLine('开始遍历文件');
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;

			// 输出文件信息
			outputChannel.appendLine(`文件路径: ${document.uri.fsPath}`);
			outputChannel.appendLine(`文件语言: ${document.languageId}`);

			const content = getFileContent(document);
			const fileName = document.uri.fsPath.split('/').pop();
			// 收集变量
			try {
				const result = oxc.parseSync(fileName, content);
				outputChannel.appendLine('oxc解析结束', JSON.stringify(result));
				for (const item of result.program.body) {
					const { type, callee, declarations } = item
					const { id = {}, init = {} } = declarations?.[0] || {}
					// outputChannel.appendLine(`类型: ${JSON.stringify(item)}`);
					// TODO: 声明的变量,ref/computed 之类的
					if (type === 'VariableDeclaration') {
						if (init.callee.name === 'ref') {
							MATCH_VAR.ref.push(id.name)
						}
						if (init.callee.name === 'computed') {
							MATCH_VAR.computed.push(id.name)
						}
						if (init.callee.name.toLowerCase().includes('store')) {
							console.log('store', JSON.stringify(item))
							const { properties = [] } = id || {}
							for (const item of properties) {
								const key = item.key.name
								const value = item.value.name
								MATCH_VAR.storeValue.push(key)
							}
						}
					}
				}
				console.log('匹配的变量', MATCH_VAR)
			} catch (e) {
				outputChannel.appendLine(`oxc解析失败: ${e.message}`);
			}
			// 生成正则表达式
			const regMap = {}
			for (const [key, value] of Object.entries(MATCH_VAR)) {
				if (value.length === 0) continue
				regMap[key] = new RegExp(`${value.join('|')}`, 'g')
			}
			console.log('正则表达式', regMap)
			// 根据token遍历
			const tokens = oxc.tokenize(content)
			for (const token of tokens) {
				console.log('token', token)
			}
		} else {
			outputChannel.appendLine('没有活动的编辑器');
		}
	});

	// 修改订阅部分
	context.subscriptions.push(fileOpenListener);
	context.subscriptions.push(addDecoration);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
