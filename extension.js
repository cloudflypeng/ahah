const vscode = require('vscode');

// import { decorationStore } from './decoration';

function activate(context) {
	console.log('Congratulations, your extension "ahah" is now active!');

	// 创建一个装饰器类型
	const decorationStore = vscode.window.createTextEditorDecorationType({
		before: {
			contentText: '🏪 ',
			margin: '0 0.2em 0 0'
		}
	});

	// 注册右键菜单命令
	const rightClickCommand = vscode.commands.registerCommand('ahah.rightClickCommand', () => {
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
			editor.setDecorations(decorationStore, decorationRanges);
		}
	});

	// 监听文件打开事件
	const fileOpenListener = vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			const document = editor.document;
			// 检查是否是 JavaScript 相关文件
			if (document.languageId === 'javascript' ||
				document.languageId === 'typescript' ||
				document.languageId === 'javascriptreact') {
				// 执行命令
				vscode.commands.executeCommand('ahah.rightClickCommand');
			}
		}
	});

	context.subscriptions.push(rightClickCommand);
	context.subscriptions.push(decorationStore); // 注册装饰器类型以便在扩展停用时清理
	context.subscriptions.push(fileOpenListener); // 注册文件打开监听器

	// 原有的 helloWorld 命令
	const disposable = vscode.commands.registerCommand('ahah.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from ahah!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
