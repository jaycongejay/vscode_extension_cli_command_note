(function () {
	const vscode = acquireVsCodeApi();
	const commandList = document.getElementById("commandList");
	const addBtn = document.getElementById("addBtn");
	const resetBtn = document.getElementById("resetBtn");

	window.addEventListener("message", (event) => {
		const data = event.data;
		switch (data.type) {
			case "commandList":
				vscode.setState(data.values);
				showCommandList();
				break;
			case "resetCommandList":
				commandList.replaceChildren();
				vscode.setState([]);
				break;
		}
	});

	const listItemHtml = (newCommandValue, index) => {
		const div = document.createElement("div");
		div.className = "listItemContainer";
		div.id = `listDiv${index}`;

		const item = `
            <div class="commandBtns">
                <button class="copyBtn" id="listItemCopyBtn_${index}">copy</botton>
                <button class="deleteBtn" id="listItemDeleteBtn_${index}">Delete</botton>
            </div>
            <div class="commandValue" id="listItemValue_${index}">${newCommandValue}</div>
        `;

		div.innerHTML = item;
		setListButtonActions();

		return div;
	};
	// Add button
	addBtn.addEventListener("click", () => {
		const newCommand = document.getElementById("commandInput");
		const newItemIndex = vscode?.getState().length;

		if (!checkIsNewCommandExist(newCommand.value) && newCommand.value !== "") {
			const existingCommandList = vscode?.getState() ?? [];
			const updateCommandList = [...existingCommandList, newCommand.value];

			// Send messages to the webview
			vscode.postMessage({
				type: "add",
				values: updateCommandList
			});

			const itemDiv = listItemHtml(newCommand.value, newItemIndex);
			commandList.appendChild(itemDiv);
			vscode.setState(updateCommandList);
			setListButtonActions();
		}
	});
	// Reset button
	resetBtn.addEventListener("click", () => {
		// Send messages to the webview
		vscode.postMessage({
			type: "reset",
			values: []
		});
	});

	function copyItem(e) {
		console.log("copied");

		const seletedCommand = getSelectedCommand(e.target.id);

		navigator.clipboard.writeText(seletedCommand.command).then(
			function () {
				console.log("Async: Copying to clipboard was successful!");
			},
			function (err) {
				console.error("Async: Could not copy text: ", err);
			}
		);
	}

	function deleteItem(e) {
		console.log("deleted");

		const seletedCommand = getSelectedCommand(e.target.id);
		const updated = vscode
			.getState()
			.filter((item) => item !== seletedCommand.command);

		vscode.postMessage({
			type: "delete",
			values: updated
		});

		const selectedListItemDiv = document.getElementById(
			`listDiv${seletedCommand.itemID}`
		);
		commandList.removeChild(selectedListItemDiv);
		vscode.setState(updated);
		setListButtonActions();
	}

	function getSelectedCommand(deleteBtnID) {
		const valueID = deleteBtnID.split("_")[1];
		const seletedCommand = document.getElementById(
			`listItemValue_${valueID}`
		).textContent;
		return { itemID: valueID, command: seletedCommand };
	}

	function setListButtonActions() {
		var listItem = document.getElementsByClassName("listItemContainer");
		for (let item of listItem) {
			const btns = item.getElementsByClassName("commandBtns");
			const copyBtn = btns[0].getElementsByClassName("copyBtn");
			const deleteBtn = btns[0].getElementsByClassName("deleteBtn");
			copyBtn[0].onclick = copyItem;
			deleteBtn[0].onclick = deleteItem;
		}
	}

	function showCommandList() {
		vscode.getState()?.forEach((command, index) => {
			commandList.appendChild(listItemHtml(command, index));
		});

		setListButtonActions();
	}

	function checkIsNewCommandExist(newCommand) {
		const isAlreadyExist = vscode
			.getState()
			?.some((command) => command === newCommand);

		if (isAlreadyExist) {
			vscode.postMessage({
				type: "onError",
				value: "The new command already exists"
			});
		}
		return isAlreadyExist;
	}

	showCommandList();
})();
