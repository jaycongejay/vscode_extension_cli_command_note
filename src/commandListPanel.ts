import * as vscode from "vscode";
import { GLOBAL_STATE_KEY } from "./constants";
import { getNonce } from "./getNonce";

export class CommandListPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: CommandListPanel | undefined;

	public static readonly viewType = "hello-world";

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private readonly _context: vscode.ExtensionContext;
	private _disposables: vscode.Disposable[] = [];

	private constructor(
		panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
		context: vscode.ExtensionContext
	) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._context = context;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
	}

	public static createOrShow(
		extensionUri: vscode.Uri,
		context: vscode.ExtensionContext
	) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (CommandListPanel.currentPanel) {
			CommandListPanel.currentPanel._panel.reveal(column);
			CommandListPanel.currentPanel._update();
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			CommandListPanel.viewType,
			"My command list",
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [
					vscode.Uri.joinPath(extensionUri, "media"),
					vscode.Uri.joinPath(extensionUri, "out/compiled")
				]
			}
		);

		// Get my command list from global state
		const getExistingMyCommandList: string[] | undefined =
			context.globalState.get(GLOBAL_STATE_KEY);

		panel.webview.postMessage({
			type: "commandList",
			values: getExistingMyCommandList
		});

		CommandListPanel.currentPanel = new CommandListPanel(
			panel,
			extensionUri,
			context
		);
	}

	public static kill() {
		CommandListPanel.currentPanel?.dispose();
		CommandListPanel.currentPanel = undefined;
	}

	public static revive(
		panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
		context: vscode.ExtensionContext
	) {
		CommandListPanel.currentPanel = new CommandListPanel(
			panel,
			extensionUri,
			context
		);
	}

	public dispose() {
		console.log("webview tab is closed");

		CommandListPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private async resetMyCommandList(values: string[]) {
		const answer = await vscode.window.showInformationMessage(
			"Clear all your stored commands?",
			"Yes",
			"No"
		);

		if (answer === "Yes") {
			vscode.window.showInformationMessage("All commands have been deleted");
			this._context.globalState.update(GLOBAL_STATE_KEY, values);
			this._panel.webview.postMessage({
				type: "resetCommandList",
				values: undefined
			});
		}
	}

	private async _update() {
		const webview = this._panel.webview;
		this._panel.webview.html = this._getHtmlForWebview(webview);
		webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "add": {
					if (!data.values) {
						return;
					}
					console.log("A new command has been added");
					this._context.globalState.update(GLOBAL_STATE_KEY, data.values);
					break;
				}
				case "delete": {
					if (!data.values) {
						return;
					}
					console.log("The command has been deleted");
					this._context.globalState.update(GLOBAL_STATE_KEY, data.values);
					break;
				}
				case "reset": {
					this.resetMyCommandList(data.values);
					break;
				}
				case "onError": {
					if (!data.value) {
						return;
					}
					vscode.window.showErrorMessage(data.value);
					break;
				}
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
		);

		webview.postMessage;

		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
		);
		const stylesMainUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
		);

		// // Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <!--
                Use a content security policy to only allow loading images from https or from our extension directory,
                and only allow scripts that have a specific nonce.
            -->
            <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${stylesResetUri}" rel="stylesheet">
            <link href="${stylesMainUri}" rel="stylesheet">
            <script nonce="${nonce}">
            </script>
        </head>
        <body>
            <input id="commandInput" />
			<div id="headBtnsContainer">
				<button id="addBtn">Add</button>
				<button id="resetBtn">Reset</button>
			</div>
            <div id="commandList"></div>
        </body>
        <script src="${scriptUri}" nonce="${nonce}"/>
        </html>`;
	}
}
