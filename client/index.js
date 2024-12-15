const { ipcRenderer } = require("electron");
const envy = require('envy');
const { webUtils } = require('electron')

const env = envy('.env')

const apiEndpoint = env.endpoint;
let historyStack = [];

document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("directory-list");

    dropArea.addEventListener("dragstart", (event) => {
        event.preventDefault();
        dropArea.classList.add("drag-over");
    });

    dropArea.addEventListener("dragover", (event) => {
        event.preventDefault()
        dropArea.classList.remove("drag-over");
    });

    dropArea.addEventListener("drop", (event) => {
        event.preventDefault();
        dropArea.classList.remove("drag-over");

        const files = event.dataTransfer.files;
        const dir = dropArea.dataset.dir || "/";

        if (files) {
            const file = files.item(0)
            const path = webUtils.getPathForFile(file)
            if (path){
                ipcRenderer.send("transfer-files", { path, dir });
                ipcRenderer.on("debug-log", (event, message) => {
                    console.log(message)
                })
                ipcRenderer.on("transfer-success", () => {
                    location.reload()
                })
            }
        }
    });
});

function editFileClicked(event) {
    const editIcon = event.currentTarget;
    const index = editIcon.getAttribute('index')
    const cardBody = editIcon.closest('.card-body');
    const itemNameSpan = cardBody.querySelector('#item-name');
    const currentName = itemNameSpan.textContent.trim();

    const inputBox = document.createElement('input');
    inputBox.type = 'text';
    inputBox.value = currentName;
    inputBox.classList.add('form-control');
    itemNameSpan.replaceWith(inputBox);
    inputBox.focus();
    inputBox.setAttribute("index", index)

    inputBox.addEventListener('keydown', (e, index) => {
        if (e.key === 'Enter') {
            const name = inputBox.value.trim();
            if (name) {
                const path = JSON.parse(localStorage.getItem("directories"))[inputBox.getAttribute('index')].path
                ipcRenderer.send("edit-file", { name, path });
                ipcRenderer.on("debug-log", (event, message) => {
                    console.log("message")
                })
                ipcRenderer.on("edit-success", () => {
                    location.reload()
                })
                
                window.reload()
            }
        } else if (e.key === 'Escape') {
            const revertedSpan = document.createElement('span');
            revertedSpan.id = 'item-name';
            revertedSpan.innerHTML = currentName;
            inputBox.replaceWith(revertedSpan);
            console.log('Edit canceled');
        }
    });
}

function deleteFile (event) {
    const deleteIcon = event.currentTarget
    const index = deleteIcon.getAttribute("index")
    const item = JSON.parse(localStorage.getItem("directories"))[index]
    const file = item.path
    ipcRenderer.send("delete-file", { file, type: item.type })
    ipcRenderer.on("delete-success", () => {
        location.reload()
    })
}

function fetchDirectory(dir) {
    fetch(apiEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ dir }),
    })
        .then((response) => response.json())
        .then((data) => {
            renderDirectory(data, dir);
            updateBackButton();
            const transformed = data.reduce((acc, item) => {
                acc[item.id] = { name: item.name, path: item.path, type: item.type };
                return acc;
            }, {});
            localStorage.setItem('directories', JSON.stringify(transformed))
        })
        .catch(() => {
            document.querySelector("#directory-list").innerHTML =
                '<div class="alert alert-danger">Failed to load directory.</div>';
        });
}

function renderDirectory(data, currentDir) {
    const target = document.querySelector("#directory-list");
    target.setAttribute("data-dir", currentDir)

    if (Array.isArray(data)) {
        target.innerHTML = `
            <div class="row">
                ${data.map((item, index) => (`
                    <div class="col-md-3 mb-3">
                        <div class="card">
                            <div class="card-body item" index=${index}>
                                ${
                                    item.type === "directory"
                                        ? `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M4 4a2 2 0 0 1 2-2h3.5a2 2 0 0 1 1.6.8L12 4h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z"/></svg>`
                                        : `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M4.293 1.5A1 1 0 0 1 5 1h6a1 1 0 0 1 .707.293l3 3A1 1 0 0 1 15 5v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1.293zM4.5 4a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V5a.5.5 0 0 0-.146-.354l-2-2A.5.5 0 0 0 9.5 2H5a.5.5 0 0 0-.5.5z"/></svg>`
                                }
                                <span id="item-name">
                                    ${
                                        item.type === "directory"
                                            ? `<a href="#" data-path="${item.path}" class="directory-link">${item.name}</a>`
                                            : item.name
                                    }
                                </span>
                                <span id="edit-file" onclick="editFileClicked(event)" index=${index}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                                    </svg>
                                </span>
                                <span id="delete-file" onclick="deleteFile(event)" index=${index}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </div>`)).join("")}
            </div>
        `;

        document.querySelectorAll(".directory-link").forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                const path = event.target.getAttribute("data-path");
                historyStack.push(currentDir);
                fetchDirectory(path);
            });
        });
    } else {
        target.innerHTML = `<div class="alert alert-danger">Failed to load directory.</div>`;
    }
}

function updateBackButton() {
    const backButton = document.getElementById("back-button");
    if (historyStack.length > 0) {
        backButton.style.display = "block";
        backButton.addEventListener("click", () => {
            const previousDir = historyStack.pop();
            fetchDirectory(previousDir);
        });
    } else {
        backButton.style.display = "none";
    }
}

function closeTab(e) {
    const closeButton = e.currentTarget
    const cardBody = closeButton.closest('.col-md-3')
    console.log(cardBody)
    const row = document.querySelector(".row")
    row.removeChild(cardBody)
}

function createFile(e) {
    console.log("here")
    if (e.key === 'Enter') {
        const name = e.currentTarget.value.trim();
        console.log(e.currentTarget, e.currentTarget.value)
        if (name) {
            const target = document.querySelector("#directory-list");
            const curDir = target.getAttribute("data-dir")
            ipcRenderer.send("create-file", { name, path: curDir, type: "file" });
            ipcRenderer.on("debug-log", (event, message) => {
                console.log("message")
            })
            ipcRenderer.on("create-success", () => {
                location.reload()
            })
        }
    }
}


function createDirectory(e) {
    console.log("here")
    if (e.key === 'Enter') {
        const name = e.currentTarget.value.trim();
        if (name) {
            const target = document.querySelector("#directory-list");
            const curDir = target.getAttribute("data-dir")
            ipcRenderer.send("create-file", { name, path: curDir, type: "dir" });
            ipcRenderer.on("debug-log", (event, message) => {
                console.log("message")
            })
            ipcRenderer.on("create-success", () => {
                location.reload()
            })
        }
    }
}


fetchDirectory("/sdcard");

const container = document.querySelector('.container');
const contextMenu = document.getElementById('context-menu');
let clipboard = null;

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const target = e.target;
    const isItem = target.classList.contains('item');
    const copyOption = document.getElementById('copy');
    const moveOption = document.getElementById('move');
    const pasteOption = document.getElementById('paste');
    const newFileOption = document.getElementById('new-file');
    const newDirOption = document.getElementById('new-directory');

    if (isItem) {
        copyOption.classList.remove('hidden');
        moveOption.classList.remove('hidden');
        newFileOption.classList.add('hidden');
        newDirOption.classList.add('hidden');

        const copyItem = e.target.closest(".item")
        const fileItem = JSON.parse(localStorage.getItem("directories"))[copyItem.getAttribute("index")]

        copyOption.setAttribute("copied_item", fileItem.path)
        moveOption.setAttribute("copied_item", fileItem.path)


    } else {
        copyOption.classList.add('hidden');
        moveOption.classList.add('hidden');
        newFileOption.classList.remove('hidden');
        newDirOption.classList.remove('hidden');
    }

    if (clipboard) {
        pasteOption.classList.remove('hidden');
    } else {
        pasteOption.classList.add('hidden');
    }

    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.display = 'block';
    contextMenu.dataset.target = isItem ? target.textContent : '';
});

document.addEventListener('click', () => {
    contextMenu.style.display = 'none';
});

document.getElementById('new-file').addEventListener('click', (e) => {
    const listDiv = document.querySelector(".row")
    const colDiv = document.createElement('div');
    colDiv.classList.add("col-md-3" ,"mb-3")

    const cardDiv = document.createElement('div')
    cardDiv.classList.add("card")

    const cardItemDiv = document.createElement("div")
    cardItemDiv.classList.add("card-body", "item")
    
    cardItemDiv.innerHTML = `
        <span id="item-name-input">
            <input type="text" class="form-control" onkeydown="createFile(event)"></input>
        </span>
        <span id="delete-file" onclick="closeTab(event)"}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </span>
    `

    cardDiv.appendChild(cardItemDiv)
    colDiv.appendChild(cardDiv)
    listDiv.appendChild(colDiv)
});

document.getElementById('new-directory').addEventListener('click', () => {
    const listDiv = document.querySelector(".row")
    const colDiv = document.createElement('div');
    colDiv.classList.add("col-md-3" ,"mb-3")

    const cardDiv = document.createElement('div')
    cardDiv.classList.add("card")

    const cardItemDiv = document.createElement("div")
    cardItemDiv.classList.add("card-body", "item")
    
    cardItemDiv.innerHTML = `
        <span id="item-name-input">
            <input type="text" class="form-control" onkeydown="createDirectory(event)"></input>
        </span>
        <span id="delete-file" onclick="closeTab(event)"}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </span>
    `

    cardDiv.appendChild(cardItemDiv)
    colDiv.appendChild(cardDiv)
    listDiv.appendChild(colDiv)
});

document.getElementById('copy').addEventListener('click', (e) => {
    const copyItem = e.target.getAttribute("copied_item")
    clipboard = {
        item: copyItem,
        type: "copy"
    };
});

document.getElementById('move').addEventListener('click', (e) => {
    const copyItem = e.target.getAttribute("copied_item")
    clipboard = {
        item: copyItem,
        type: "move"
    };
})

document.getElementById('paste').addEventListener('click', () => {
    if (clipboard) {
        const target = document.querySelector("#directory-list");
        const curDir = target.getAttribute("data-dir")
        clipboard.newPath = curDir
        ipcRenderer.send("copy-paste", { data: clipboard })
        ipcRenderer.on("paste-success", (message) => {
            location.reload()
        })
        clipboard = null;
    }
});