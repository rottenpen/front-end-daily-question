const tempy = require("tempy");
const headlessVisit = require("./sharePoster");
const queryString = require("query-string");
const execa = require("execa");
// const SAVE_DIRECTORY = tempy.directory();
const SAVE_DIRECTORY = tempy.directory();

const FULL_DOWNLOADED_PATH = `${SAVE_DIRECTORY}/carbon.png`;

const processContent = (input, START = 0, END = 1000) => {
	const NEW_LINE = "\n";

	return new Promise((resolve, reject) => {
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

const imgToClipboard = async (imgPath) => {
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

(async () => {
	const input = `
export default {
  GOTO: 'GOTO',
  VIEWPORT: 'VIEWPORT',
  WAITFORSELECTOR: 'WAITFORSELECTOR',
  NAVIGATION: 'NAVIGATION',
  NAVIGATION_PROMISE: 'NAVIGATION_PROMISE',
  FRAME_SET: 'FRAME_SET',
  SCREENSHOT: 'SCREENSHOT'
}
`;
	const processedContent = await processContent(input);
	const urlEncodedContent = encodeURIComponent(processedContent);
	const settings = {
		code: urlEncodedContent,
		l: "auto",
	};
	let url = "https://carbon.now.sh/";
	url = `${url}?${queryString.stringify(settings)}`;
	await headlessVisit({
		url,
		location: SAVE_DIRECTORY,
		type: "png",
		headless: true,
	});

	const downloadedAs = FULL_DOWNLOADED_PATH;
	console.log(downloadedAs);
	await imgToClipboard(downloadedAs);
})();
