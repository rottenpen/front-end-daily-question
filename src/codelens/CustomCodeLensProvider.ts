import * as vscode from "vscode";

export class CustomCodeLensProvider implements vscode.CodeLensProvider {
	private onDidChangeCodeLensesEmitter: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();

	get onDidChangeCodeLenses(): vscode.Event<void> {
		return this.onDidChangeCodeLensesEmitter.event;
	}

	public refresh(): void {
		this.onDidChangeCodeLensesEmitter.fire();
	}

	public provideCodeLenses(
		document: vscode.TextDocument
	): vscode.ProviderResult<vscode.CodeLens[]> {
		const content: string = document.getText();
		let ext: string | undefined;
		if (document.fileName.endsWith(".md")) {
			ext = "md";
		}
		if (document.fileName.endsWith(".js")) {
			ext = "js";
		}
		let codeLensLine: number = document.lineCount - 1;
		for (let i: number = document.lineCount - 1; i >= 0; i--) {
			const lineContent: string = document.lineAt(i).text;
			if (ext === "md" && lineContent.indexOf("*[interview]: end") >= 0) {
				codeLensLine = i;
				break;
			}
			if (ext === "js" && lineContent.indexOf("// @interview end") >= 0) {
				codeLensLine = i;
				break;
			}
		}
		if (ext === void 0) {
			return [];
		}

		if (
			(content.indexOf("*[interview]: start") < 0 ||
				content.indexOf("*[interview]: end") < 0) &&
			ext === "md"
		) {
			return [];
		}

		if (
			(content.indexOf("// @interview start") < 0 ||
				content.indexOf("// @interview end") < 0) &&
			ext === "js"
		) {
			return [];
		}

		const range: vscode.Range = new vscode.Range(
			codeLensLine,
			0,
			codeLensLine,
			0
		);
		const codeLens: vscode.CodeLens[] = [];

		codeLens.push(
			new vscode.CodeLens(range, {
				title: "☑️提交答案",
				command: "interview.postAnswer",
				arguments: [document, content],
			})
		);

		codeLens.push(
			new vscode.CodeLens(range, {
				title: "👀查看题解",
				command: "interview.openAnswer",
				arguments: [document],
			})
		);

		codeLens.push(
			new vscode.CodeLens(range, {
				title: "👍分享题目",
				command: "interview.sharePoster",
				arguments: [content],
			})
		);
		return codeLens;
	}
}

export const customCodeLensProvider: CustomCodeLensProvider = new CustomCodeLensProvider();
