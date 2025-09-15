export async function GameAlert(message) {
    return new Promise((resolve) => {
        // 创建遮罩
        const backdrop = document.createElement("div");
        backdrop.className = "custom-alert-backdrop";

        // 创建弹窗
        const box = document.createElement("div");
        box.className = "custom-alert-box";
        box.innerHTML = `
      <div>${message}</div>
      <button class="custom-alert-button">Confirm</button>
    `;

        backdrop.appendChild(box);
        document.body.appendChild(backdrop);

        // 点击按钮关闭
        box.querySelector("button").addEventListener("click", () => {
            document.body.removeChild(backdrop);
            resolve(true);
        });
    });
}

export async function GamePrompt(message, defaultValue = "") {
    return new Promise((resolve) => {
        // 遮罩
        const backdrop = document.createElement("div");
        backdrop.className = "custom-prompt-backdrop";

        // 弹窗
        const box = document.createElement("div");
        box.className = "custom-prompt-box";
        box.innerHTML = `
      <div>${message}</div>
      <input class="custom-prompt-input" type="text" value="${defaultValue}" />
      <div class="custom-prompt-actions">
        <button class="custom-prompt-button custom-prompt-ok">Confirm</button>
        <button class="custom-prompt-button custom-prompt-cancel">Cancle</button>
      </div>
    `;

        backdrop.appendChild(box);
        document.body.appendChild(backdrop);

        const input = box.querySelector("input");
        input.focus();

        // 点击确定
        box.querySelector(".custom-prompt-ok").addEventListener("click", () => {
            const value = input.value;
            document.body.removeChild(backdrop);
            resolve(value);
        });

        // 点击取消
        box.querySelector(".custom-prompt-cancel").addEventListener(
            "click",
            () => {
                document.body.removeChild(backdrop);
                resolve(null);
            }
        );

        // 回车提交
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                box.querySelector(".custom-prompt-ok").click();
            }
        });
    });
}

export async function CreateGamePrompt(message, suggestList = []) {
    return new Promise((resolve) => {
        // 遮罩
        const backdrop = document.createElement("div");
        backdrop.className = "custom-prompt-backdrop";

        // 弹窗
        const box = document.createElement("div");
        box.className = "custom-prompt-box";
        box.innerHTML = `
      <div>${message}</div>
      <input class="custom-prompt-input addr-input" type="text" placeholder="Opponent Address" />
      <div class="custom-suggest-list"></div>
      <span>You want first move or second move?</span>
      <div class="custom-radio-group">
        <label><input type="radio" name="turn" value="1" checked /> First move</label>
        <label><input type="radio" name="turn" value="2" /> Second move</label>
      </div>
      <div class="custom-prompt-actions">
        <button class="custom-prompt-button custom-prompt-ok">Confirm</button>
        <button class="custom-prompt-button custom-prompt-cancel">Cancel</button>
      </div>
    `;

        backdrop.appendChild(box);
        document.body.appendChild(backdrop);

        const input = box.querySelector(".addr-input");
        input.focus();

        // 渲染 suggestList
        const suggestBox = box.querySelector(".custom-suggest-list");
        suggestList.forEach((i) => {
            const item = document.createElement("div");
            item.className = "custom-suggest-item";
            item.textContent = checkIfFriendAddress(i.address);
            item.addEventListener("click", () => {
                input.value = i.address;
            });
            suggestBox.appendChild(item);
        });

        // 点击确定
        box.querySelector(".custom-prompt-ok").addEventListener("click", () => {
            const addr = input.value.trim();
            const turn = box.querySelector('input[name="turn"]:checked').value;
            document.body.removeChild(backdrop);
            resolve([addr, parseInt(turn)]);
        });

        // 点击取消
        box.querySelector(".custom-prompt-cancel").addEventListener(
            "click",
            () => {
                document.body.removeChild(backdrop);
                resolve(null);
            }
        );

        // 回车提交
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                box.querySelector(".custom-prompt-ok").click();
            }
        });
    });
}

export function checkIfFriendAddress(address) {
    const friendList = JSON.parse(localStorage.getItem("friendList")) || [];
    let result = address;
    friendList.forEach((item) => {
        if (item.address == address) {
            result = `${item.address}-${item.name}(your friend)`;
        }
    });
    return result;
}

export function changeLog(text, state) {
    //state=0 loading =1 success =2 fail
    const load_svg = document.querySelector(".log_container #loading_svg");
    const success_svg = document.querySelector(".log_container #success_svg");
    const false_svg = document.querySelector(".log_container #false_svg");
    const load_text = document.querySelector(".log_container #log_text");
    load_text.textContent = text;
    if (state == 0) {
        success_svg.style.display = "none";
        false_svg.style.display = "none";
        load_svg.style.display = "block";
    } else if (state == 1) {
        false_svg.style.display = "none";
        load_svg.style.display = "none";
        success_svg.style.display = "block";
    } else if (state == -1) {
        success_svg.style.display = "none";
        load_svg.style.display = "none";
        false_svg.style.display = "block";
    }
}
