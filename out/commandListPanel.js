"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandListPanel = void 0;
const vscode = require("vscode");
const constants_1 = require("./constants");
const getNonce_1 = require("./getNonce");
class CommandListPanel {
    constructor(panel, extensionUri, context) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._context = context;
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }
    static createOrShow(extensionUri, context) {
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
        const panel = vscode.window.createWebviewPanel(CommandListPanel.viewType, "My command list", column || vscode.ViewColumn.One, {
            // Enable javascript in the webview
            enableScripts: true,
            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, "media"),
                vscode.Uri.joinPath(extensionUri, "out/compiled")
            ]
        });
        // Get my command list from global state
        const getExistingMyCommandList = context.globalState.get(constants_1.GLOBAL_STATE_KEY);
        panel.webview.postMessage({
            type: "commandList",
            values: getExistingMyCommandList
        });
        CommandListPanel.currentPanel = new CommandListPanel(panel, extensionUri, context);
    }
    static kill() {
        var _a;
        (_a = CommandListPanel.currentPanel) === null || _a === void 0 ? void 0 : _a.dispose();
        CommandListPanel.currentPanel = undefined;
    }
    static revive(panel, extensionUri, context) {
        CommandListPanel.currentPanel = new CommandListPanel(panel, extensionUri, context);
    }
    dispose() {
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
    resetMyCommandList(values) {
        return __awaiter(this, void 0, void 0, function* () {
            const answer = yield vscode.window.showInformationMessage("Clear all your stored commands?", "Yes", "No");
            if (answer === "Yes") {
                vscode.window.showInformationMessage("All commands have been deleted");
                this._context.globalState.update(constants_1.GLOBAL_STATE_KEY, values);
                this._panel.webview.postMessage({
                    type: "resetCommandList",
                    values: undefined
                });
            }
        });
    }
    _update() {
        return __awaiter(this, void 0, void 0, function* () {
            const webview = this._panel.webview;
            this._panel.webview.html = this._getHtmlForWebview(webview);
            webview.onDidReceiveMessage((data) => __awaiter(this, void 0, void 0, function* () {
                switch (data.type) {
                    case "add": {
                        if (!data.values) {
                            return;
                        }
                        console.log("A new command has been added");
                        this._context.globalState.update(constants_1.GLOBAL_STATE_KEY, data.values);
                        break;
                    }
                    case "delete": {
                        if (!data.values) {
                            return;
                        }
                        console.log("The command has been deleted");
                        this._context.globalState.update(constants_1.GLOBAL_STATE_KEY, data.values);
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
            }));
        });
    }
    _getHtmlForWebview(webview) {
        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "main.js"));
        webview.postMessage;
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        // // Use a nonce to only allow specific scripts to be run
        const nonce = (0, getNonce_1.getNonce)();
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
exports.CommandListPanel = CommandListPanel;
CommandListPanel.viewType = "hello-world";
//# sourceMappingURL=commandListPanel.js.map