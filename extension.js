const vscode = require('vscode');

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

// 监听文件打开事件
const fileOpenListener = vscode.window.onDidChangeActiveTextEditor(editor => {
	if (editor) {
		const document = editor.document;
		// 检查是否是 JavaScript 相关文件
		const isJsFile = ['javascript', 'typescript', 'javascriptreact'].includes(document.languageId);
		isJsFile && vscode.commands.executeCommand('ahah.addDecoration')
	}
});

function activate(context) {
	// 生成装饰器
	const dec_map = new Map();
	for (const [key, value] of Object.entries(DECORATION_MAP)) {
		dec_map.set(key, getDecoration(value));
	};

	const addDecoration = vscode.commands.registerCommand('ahah.addDecoration', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const decorationRanges = [];

			// 遍历所有行
			for (let i = 0; i < document.lineCount; i++) {
				const line = document.lineAt(i);
				const text = line.text;

				// 使用正则表达式查找包含 "store" 的单词
				const regex = /\b\w*store\w*\b/gi; // 匹配包含 store 的完整单词
				let match = regex.exec(text);

				while (match !== null) {
					// 创建匹配单词的范围
					const range = new vscode.Range(
						new vscode.Position(i, match.index),
						new vscode.Position(i, match.index + match[0].length)
					);
					decorationRanges.push(range);
					match = regex.exec(text);
				}
			}

			// 应用装饰器
			editor.setDecorations(dec_map.get('store'), decorationRanges);
		}
	});

	// 统一订阅
	for (const [key, value] of dec_map) {
		context.subscriptions.push(value);
	}
	context.subscriptions.push(addDecoration);
	context.subscriptions.push(fileOpenListener); // 注册文件打开监听器
}

// This method is called when your extension is deactivated
function deactivate(context) {
	for (const decoration of context.subscriptions) {
		decoration.dispose();
	}
}

module.exports = {
	activate,
	deactivate
}
