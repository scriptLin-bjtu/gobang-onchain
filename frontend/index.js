import {
    ABI,
    connectToProvider,
    connectToWallet,
    connectToContract,
    checkWalletTrue,
    getGameBoard,
    pollEvent,
    createAccount,
    checkIfYourTurn,
} from "./smartcontract";
import { drawBoard, printGameState } from "./gameboard";
import { GameAlert, GamePrompt } from "./utils";
const container = document.querySelector(".main_container");
let PROVIDER;
let WALLET;
let PRIVATE_KEY;
let CONTRACT;
let CONTRACT_ADDRESS;
const routes = [
    {
        path: /^\/$/,
        view: () => `
        <div class="home">
            <input type="number" id="game_id"/>
            <button class='game_btn'>join the game</button>
            <button class='create_btn'>create a account</button>
            <p class="account_info"></p>
            <a href="https://faucet.testnet.oasys.games/" target="_blank">faucet</a>
        </div>
        `,
        func: () => {
            document
                .querySelector(".game_btn")
                .addEventListener("click", () => {
                    const id = document.querySelector("#game_id").value;
                    //console.log(id);
                    navigateTo(`/game/${id}`);
                });
            document
                .querySelector(".create_btn")
                .addEventListener("click", () => {
                    const { address, privateKey } = createAccount();
                    document.querySelector(
                        ".account_info"
                    ).innerHTML = `Please save your account information:<br/>address:${address}<br/>privateKey:${privateKey}`;
                });
        },
    },
    {
        path: /^\/game\/(\d+)$/,
        view: (match) => `
        <div class="game">
        <h1>Game ${match[1]}</h1>
        <h2 class="game_state">GameState: Loading...</h2>
        <p class="game_info">Loading...</p>
        <button class='ready_btn'>ready</button>
        <canvas id="game_canvas" width="480" height="480" style="border: 1px solid black; cursor: pointer;"></canvas>
        </div>
        `,
        func: async (match) => {
            try {
                CONTRACT_ADDRESS = await GamePrompt(
                    "enter the contract address:"
                );
                PRIVATE_KEY = await GamePrompt("enter your private key:");
                WALLET = connectToWallet(PRIVATE_KEY, PROVIDER);
                CONTRACT = connectToContract(CONTRACT_ADDRESS, ABI, WALLET);
                const valid = await checkWalletTrue(WALLET, CONTRACT, match[1]);
                const gameBoard = await getGameBoard(CONTRACT);
                //console.log("gameBoard", gameBoard);
                if (valid > 0) {
                    GameAlert("wallet is valid welcome");
                    drawBoard(gameBoard);
                    const gameState = Number(await CONTRACT.gameState());
                    document.querySelector(
                        ".game_info"
                    ).innerHTML = `Player1(Black):${await CONTRACT.p1address()}<br/>
                    Player2(White):${await CONTRACT.p2address()} <br/> ${
                        valid === 1 ? "You are Player1" : "You are Player2"
                    }`;
                    printGameState(gameState);
                    if (gameState === 0) {
                        document
                            .querySelector(".ready_btn")
                            .addEventListener("click", async () => {
                                console.log("loading...");
                                const tx = await CONTRACT.startGame();
                                const receipt = await tx.wait();
                                if (receipt.status === 1) {
                                    console.log("ready ok");
                                } else {
                                    console.log("ready error");
                                }
                            });
                        pollEvent(
                            CONTRACT,
                            PROVIDER,
                            "GameStarted",
                            async (args, event) => {
                                //等待状态->游戏状态
                                console.log("GameStarted", args);
                                const gameState = Number(
                                    await CONTRACT.gameState()
                                );
                                printGameState(gameState);
                                intoGame(gameState, CONTRACT, PROVIDER);
                            }
                        );
                    } else {
                        intoGame(gameState, CONTRACT, PROVIDER);
                    }
                } else {
                    GameAlert("wallet is not valid");
                    navigateTo(`/`);
                }
            } catch (e) {
                console.error(e);
                GameAlert("There Are Some Error");
                navigateTo(`/`);
            }
        },
    },
];

//游戏中逻辑-去除ready按钮-给canvas添加点击事件-轮询监听事件
async function intoGame(gameState, contract, provider) {
    console.log("intoGame");
    document.querySelector(".ready_btn").remove();
    if (gameState === 1 || gameState === 2) {
        document
            .querySelector("#game_canvas")
            .addEventListener("click", async (event) => {
                if (await checkIfYourTurn(CONTRACT, WALLET)) {
                    const x = event.offsetX;
                    const y = event.offsetY;
                    const gridSize = 32;
                    const boardX = Math.round(x / gridSize);
                    const boardY = Math.round(y / gridSize);
                    console.log(`position:(${boardX}, ${boardY})`);
                    const tx = await CONTRACT.newStep(boardY, boardX);
                    const receipt = await tx.wait();
                    if (receipt.status === 1) {
                        console.log("newStep ok");
                    } else {
                        console.log("newStep error");
                    }
                } else {
                    console.log("not your turn");
                    return;
                }
            });
        pollEvent(contract, provider, "NewStep", async (args, event) => {
            console.log("NewStep", args);
            drawBoard(await getGameBoard(contract));
            printGameState(Number(await contract.gameState()));
        });
        pollEvent(contract, provider, "GameEnded", async (args, event) => {
            console.log("GameEnded", args);
            drawBoard(await getGameBoard(contract));
            printGameState(Number(await contract.gameState()));
        });
    }
}

async function router() {
    const path = window.location.pathname;
    for (let route of routes) {
        const match = path.match(route.path);
        if (match) {
            container.innerHTML = route.view(match);
            route.func && (await route.func(match));
            return;
        }
    }
    container.innerHTML = "<h1>404 not found</h1>";
}

function navigateTo(path) {
    history.pushState(null, "", path);
    router();
}

// 监听前进/后退
window.addEventListener("popstate", router);

(async () => {
    router();
    PROVIDER = connectToProvider("https://rpc.testnet.oasys.games");
})();
