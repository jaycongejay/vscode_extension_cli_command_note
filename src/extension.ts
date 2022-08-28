// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { CommandListPanel } from "./commandListPanel";

const commandStart = "my-cli-command-note.helloWorld";
const commandOpenMyCommandList = "my-cli-command-note.openMyCommandList";

export function activate(context: vscode.ExtensionContext) {
	console.log(
		'Congratulations, your extension "my-cli-command-note" is now active!'
	);

	const statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		100
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(commandStart, () => {
			statusBarItem.command = commandOpenMyCommandList; // when this status bar item is clicked
			statusBarItem.text = `$(rocket) Commands`;
			statusBarItem.tooltip = `My command list`;
			statusBarItem.show();
		})
	);

	// show UI
	context.subscriptions.push(
		vscode.commands.registerCommand(commandOpenMyCommandList, () => {
			CommandListPanel.createOrShow(context.extensionUri, context);

			vscode.window.showInformationMessage("Your command list");
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
