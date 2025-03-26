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

function activate(context) {
	// 创建输出通道
	outputChannel = vscode.window.createOutputChannel('Meancode');

	// 使用 outputChannel 输出日志
	outputChannel.appendLine('扩展已激活');

	console.log('pyf-激活了')
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

			try {
				const result = oxc.parseSync(fileName, content);
				outputChannel.appendLine('oxc解析结束');
				outputChannel.appendLine(JSON.stringify(result.program));
			} catch (e) {
				outputChannel.appendLine(`oxc解析失败: ${e.message}`);
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
