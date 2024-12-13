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
            }
        }
    });
});

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
                ${data
                    .map(
                        (item) => `
                        <div class="col-md-3 mb-3">
                            <div class="card">
                                <div class="card-body item">
                                    ${
                                        item.type === "directory"
                                            ? `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M4 4a2 2 0 0 1 2-2h3.5a2 2 0 0 1 1.6.8L12 4h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z"/></svg>`
                                            : `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M4.293 1.5A1 1 0 0 1 5 1h6a1 1 0 0 1 .707.293l3 3A1 1 0 0 1 15 5v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1.293zM4.5 4a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V5a.5.5 0 0 0-.146-.354l-2-2A.5.5 0 0 0 9.5 2H5a.5.5 0 0 0-.5.5z"/></svg>`
                                    }
                                    <span>
                                        ${
                                            item.type === "directory"
                                                ? `<a href="#" data-path="${item.path}" class="directory-link">${item.name}</a>`
                                                : item.name
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    `
                    )
                    .join("")}
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

fetchDirectory("/sdcard");
