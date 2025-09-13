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
