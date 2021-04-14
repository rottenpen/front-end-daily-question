// 引用于 https://github.com/mixn/carbon-now-cli
import * as vscode from "vscode";
import * as tempy from "tempy";
import * as queryString from "query-string";
import * as execa from "execa";
import headlessVisit from "./sharePoster";
// const SAVE_DIRECTORY = tempy.directory();
const SAVE_DIRECTORY = tempy.directory();

const FULL_DOWNLOADED_PATH = `${SAVE_DIRECTORY}/carbon.png`;

const processContent = (input: string, START = 0, END = 1000) => {
	const NEW_LINE = "\n";

	return new Promise<string>((resolve, reject) => {
		// Reject immediately when nonsensical input
		if (START > END) {
			return reject();
		}

		// Otherwise resolve with the correct section
		resolve(
			input
				.split(NEW_LINE)
				.filter((line, index) => {
					const CURRENT_LINE = index + 1;
					return CURRENT_LINE >= START && CURRENT_LINE <= END;
				})
				.join(NEW_LINE)
		);
	});
};

const imgToClipboard = async (imgPath: string) => {
	const OS = process.platform;
	let SCRIPT;

	switch (OS) {
		case "darwin": {
			SCRIPT = `osascript -e 'set the clipboard to (read (POSIX file "${imgPath}") as JPEG picture)'`;
			break;
		}
		case "win32": {
			SCRIPT = `nircmd clipboard copyimage ${imgPath}`;
			break;
		}
		default: {
			SCRIPT = `xclip -selection clipboard -t image/png -i ${imgPath}`;
		}
	}

	// Running `await execa` leads to `Listr` not resolving the last task on Linux
	// Hence, we need to distinguish between OS’s and run it with or without `await`
	// This solution is not insanely beautiful, but makes it work cross-OS ¯\_(ツ)_/¯
	if (OS === "darwin" || OS === "win32") {
		await execa(SCRIPT, [], {
			shell: true,
		});
	} else {
		execa(SCRIPT, [], {
			shell: true,
		});
	}
};

export async function share(content: string): Promise<void> {
	try {
		vscode.window.showInformationMessage("正在生成图片，请稍等...");
		const processedContent = await processContent(content);
		const urlEncodedContent = encodeURIComponent(processedContent);
		const settings = {
			code: urlEncodedContent,
			l: "auto",
		};
		let url = "https://carbon.now.sh/";
		url = `${url}?${queryString.stringify(settings)}`;
		vscode.window.showInformationMessage("正在生成图片，请稍等...");
		await headlessVisit({
			url,
			location: SAVE_DIRECTORY,
			type: "png",
			headless: true,
		});
		vscode.window.showInformationMessage("生成成功，请稍等...");
		const downloadedAs = FULL_DOWNLOADED_PATH;
		await imgToClipboard(downloadedAs);
		vscode.window.showInformationMessage(
			"生成成功，图片已生成到您的剪切板，请粘贴分享！"
		);
	} catch (error) {
		console.log("err", error);
		vscode.window.showInformationMessage("生成失败！");
	}
}
