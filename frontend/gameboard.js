export function drawBoard(board = []) {
    const canvas = document.getElementById("game_canvas");
    const ctx = canvas.getContext("2d");

    const size = 480;
    const rows = 16;
    const BLOCK_WIDTH = size / (rows - 1);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;

    for (let i = 1; i < rows; i++) {
        let pos = i * BLOCK_WIDTH + 0.5;

        ctx.beginPath();
        ctx.moveTo(0.5, pos);
        ctx.lineTo(size - 0.5, pos);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pos, 0.5);
        ctx.lineTo(pos, size - 0.5);
        ctx.stroke();
    }

    board.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell === 0) return;

            let centerX = x * BLOCK_WIDTH;
            let centerY = y * BLOCK_WIDTH;
            let radius = BLOCK_WIDTH / 2 - 2;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

            if (cell === 1) {
                ctx.fillStyle = "black";
                ctx.fill();
            } else if (cell === 2) {
                ctx.fillStyle = "white";
                ctx.fill();
                ctx.strokeStyle = "black";
                ctx.stroke();
            }
        });
    });
}

export function printGameState(gameState) {
    switch (gameState) {
        case 0:
            document.querySelector(".game_state").textContent =
                "GameState: Waiting for Ready";
            break;
        case 1:
            document.querySelector(".game_state").textContent =
                "GameState: Player1 turn";
            break;
        case 2:
            document.querySelector(".game_state").textContent =
                "GameState: Player2 turn";
            break;
        case 3:
            document.querySelector(".game_state").textContent =
                "GameState: GameEnded Player1 win";
            break;
        case 4:
            document.querySelector(".game_state").textContent =
                "GameState: GameEnded Player2 win";
            break;
    }
}
