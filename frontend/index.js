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
    MENU_ABI,
} from "./smartcontract";
import { drawBoard, printGameState } from "./gameboard";
import {
    GameAlert,
    GamePrompt,
    CreateGamePrompt,
    checkIfFriendAddress,
    changeLog,
} from "./utils";
const container = document.querySelector(".main_container");
let PROVIDER;
let WALLET;
let CONTRACT;
let CONTRACT_ADDRESS;
let MENU_CONTRACT;
let MENU_CONTRACT_ADDRESS = "0x40d531023a9256d22af1d2d03b33a951f8db9c6c";
const routes = [
    {
        path: /^\/$/,
        view: () => `
        <div class="home">
            <div class="account_info basic">not sign in</div>
            <input type="number" min="0" step="1" id="game_id" placeholder="enter game id"/>
            <button class='game_btn'>join the game</button>
            <button class='create_game_btn'>create a game</button>
            <button class='players_btn'>find players & friends</button>
            <button class='sign_btn'>sign in</button>
            <button class='create_btn'>create a account</button>
            <p class="account_info notice"></p>
            <button class='register_btn'>Register your account</button>
            <a href="https://faucet.testnet.oasys.games/" target="_blank">faucet</a> |
            <a href="https://github.com/scriptLin-bjtu/gobang-onchain" target="_blank">guide</a> |
            <a href="https://explorer.testnet.oasys.games/address/0x40d531023A9256D22Af1D2D03b33A951F8DB9C6C" target="_blank">contract</a>
            <p class="total_info"></p>
            </div>
        `,
        func: async () => {
            if (WALLET) {
                const playerInfo = await MENU_CONTRACT.getPlayerInfo(
                    WALLET.address
                );
                printPlayerInfo(playerInfo);
                await printTotalInfo();
            }
            document
                .querySelector(".game_btn")
                .addEventListener("click", async () => {
                    try {
                        if (!WALLET) {
                            GameAlert("Please sign in first");
                            return;
                        }
                        const id = document.querySelector("#game_id").value;
                        if (id && (await MENU_CONTRACT.getGameAddress(id))) {
                            //console.log(id);
                            navigateTo(`/game/${id}`);
                            return;
                        }
                        GameAlert("Game Not Found");
                    } catch (e) {
                        GameAlert("There Are Some Error");
                        console.error(e);
                    }
                });
            document
                .querySelector(".create_game_btn")
                .addEventListener("click", async () => {
                    try {
                        if (!WALLET) {
                            GameAlert("Please sign in first");
                            return;
                        }
                        const [addr, option] = await CreateGamePrompt(
                            "Enter your opponent's address:",
                            []
                        );
                        //console.log(addr, option);
                        changeLog("create game", 0);
                        const tx =
                            option == 1
                                ? await MENU_CONTRACT.createGame(
                                      WALLET.address,
                                      addr
                                  )
                                : await MENU_CONTRACT.createGame(
                                      addr,
                                      WALLET.address
                                  );
                        const receipt = await tx.wait();
                        if (receipt.status === 1) {
                            //GameAlert("create game ok");
                            const playerInfo =
                                await MENU_CONTRACT.getPlayerInfo(
                                    WALLET.address
                                );
                            printPlayerInfo(playerInfo);
                            await printTotalInfo();
                            changeLog("create game", 1);
                        } else {
                            GameAlert("create game error");
                            changeLog("create game", -1);
                        }
                    } catch (e) {
                        GameAlert("There Are Some Error");
                        changeLog("create game", -1);
                        console.error(e);
                    }
                });
            document
                .querySelector(".players_btn")
                .addEventListener("click", () => {
                    if (!WALLET) {
                        GameAlert("Please sign in first");
                        return;
                    }
                    navigateTo(`/players`);
                });
            document
                .querySelector(".create_btn")
                .addEventListener("click", () => {
                    const { address, privateKey } = createAccount();
                    document.querySelector(
                        ".account_info.notice"
                    ).innerHTML = `Please save your account information:<br/>address:${address}<br/>privateKey:${privateKey}`;
                });
            document
                .querySelector(".sign_btn")
                .addEventListener("click", async () => {
                    try {
                        if (WALLET) {
                            GameAlert("You have already signed in");
                            return;
                        }
                        const privateKey = await GamePrompt(
                            "enter your private key:"
                        );
                        WALLET = connectToWallet(privateKey, PROVIDER);
                        MENU_CONTRACT = connectToContract(
                            MENU_CONTRACT_ADDRESS,
                            MENU_ABI,
                            WALLET
                        );
                        const playerInfo = await MENU_CONTRACT.getPlayerInfo(
                            WALLET.address
                        );
                        printPlayerInfo(playerInfo);
                        await printTotalInfo();
                        pollEvent(
                            MENU_CONTRACT,
                            PROVIDER,
                            "GameCreated",
                            async (args, event) => {
                                console.log("GameCreated", args);
                                if (
                                    args[1] === WALLET.address ||
                                    args[2] === WALLET.address
                                ) {
                                    GameAlert(
                                        `GameCreated\ngameId:${args[0]}\nplayer1:${args[1]}\nplayer2:${args[2]}`
                                    );
                                }
                            }
                        );
                        changeLog("sign in", 1);
                    } catch (e) {
                        GameAlert("There Are Some Error");
                        changeLog("sign in", -1);
                        console.error(e);
                        WALLET = null;
                        MENU_CONTRACT = null;
                        console.error(e);
                    }
                });
            document
                .querySelector(".register_btn")
                .addEventListener("click", async () => {
                    try {
                        const privatekey = await GamePrompt(
                            "enter your private key:"
                        );
                        const tempwallet = connectToWallet(
                            privatekey,
                            PROVIDER
                        );
                        const tempcontract = connectToContract(
                            MENU_CONTRACT_ADDRESS,
                            MENU_ABI,
                            tempwallet
                        );
                        changeLog("register", 0);
                        const tx = await tempcontract.registerPlayer(
                            tempwallet.address
                        );
                        const receipt = await tx.wait();
                        if (receipt.status === 1) {
                            GameAlert("register ok");
                            changeLog("register", 1);
                        } else {
                            GameAlert("register error");
                            changeLog("register", -1);
                        }
                    } catch (e) {
                        GameAlert("There Are Some Error");
                        changeLog("register", -1);
                        console.error(e);
                    }
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
        <button class='give_up_btn' style="display: none;">give up</button>
        <button class='back_btn'>back</button>
        <canvas id="game_canvas" width="480" height="480" style="border: 1px solid black; cursor: pointer;"></canvas>
        </div>
        `,
        func: async (match) => {
            try {
                CONTRACT_ADDRESS = await MENU_CONTRACT.getGameAddress(match[1]);
                CONTRACT = connectToContract(CONTRACT_ADDRESS, ABI, WALLET);
                const valid = await checkWalletTrue(WALLET, CONTRACT, match[1]);
                const gameBoard = await getGameBoard(CONTRACT);
                drawBoard(gameBoard);
                const gameState = Number(await CONTRACT.gameState());
                document
                    .querySelector(".back_btn")
                    .addEventListener("click", () => {
                        navigateTo(`/`);
                    });
                document.querySelector(
                    ".game_info"
                ).innerHTML = `Player1(Black):${checkIfFriendAddress(
                    await CONTRACT.p1address()
                )}<br/>
                    Player2(White):${checkIfFriendAddress(
                        await CONTRACT.p2address()
                    )} <br/> ${
                    valid === 1
                        ? "You are Player1"
                        : valid === 2
                        ? "You are Player2"
                        : "You are visitor"
                }`;
                printGameState(gameState);
                if (valid > 0) {
                    GameAlert("account is valid welcome");
                    if (gameState === 0) {
                        document
                            .querySelector(".ready_btn")
                            .addEventListener("click", async () => {
                                try {
                                    console.log("loading...");
                                    changeLog("ready", 0);
                                    const tx = await CONTRACT.startGame();
                                    const receipt = await tx.wait();
                                    if (receipt.status === 1) {
                                        changeLog("ready", 1);
                                        console.log("ready ok");
                                    } else {
                                        changeLog("ready", -1);
                                        console.log("ready error");
                                    }
                                } catch (e) {
                                    console.error(e);
                                    changeLog("ready", -1);
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
                    GameAlert("you are not in the game just watching");
                    document.querySelector(".ready_btn").remove();
                    if (gameState < 3) {
                        pollEvent(
                            CONTRACT,
                            PROVIDER,
                            "NewStep",
                            async (args, event) => {
                                console.log("NewStep", args);
                                drawBoard(await getGameBoard(CONTRACT));
                                printGameState(
                                    Number(await CONTRACT.gameState())
                                );
                            }
                        );
                        pollEvent(
                            CONTRACT,
                            PROVIDER,
                            "GameEnded",
                            async (args, event) => {
                                console.log("GameEnded", args);
                                document.querySelector(".give_up_btn").remove();
                                drawBoard(await getGameBoard(CONTRACT));
                                printGameState(
                                    Number(await CONTRACT.gameState()),
                                    args[1]
                                );
                            }
                        );
                    }
                }
            } catch (e) {
                console.error(e);
                GameAlert("There Are Some Error");
                navigateTo(`/`);
            }
        },
    },
    {
        path: /^\/players$/,
        view: () => `<div class="players">
        <div class="account_info basic"></div>
        <label>Rank</label>
        <ul class="rank">
        </ul>
        <label>Frineds</label>
        <ul class="friends">
        </ul>
        <input type="text" class="search_input" placeholder="enter account address"/>
        <div class="actions">
            <button class="search_btn">search</button>
            <button class="add_friend_btn">add friend</button>
        </div>
        <button class='back_btn'>back</button>
        </div>`,
        func: async () => {
            try {
                document
                    .querySelector(".back_btn")
                    .addEventListener("click", () => {
                        navigateTo(`/`);
                    });
                await loadRankAndFriends();
                document
                    .querySelector(".search_btn")
                    .addEventListener("click", async () => {
                        try {
                            const address =
                                document.querySelector(".search_input").value;
                            const playerInfo =
                                await MENU_CONTRACT.getPlayerInfo(address);
                            printPlayerInfo(playerInfo, true);
                        } catch (e) {
                            GameAlert("Can't Find The Player");
                        }
                    });
                document
                    .querySelector(".add_friend_btn")
                    .addEventListener("click", async () => {
                        try {
                            const address =
                                document.querySelector(".search_input").value;
                            const playerInfo =
                                await MENU_CONTRACT.getPlayerInfo(address); //验证玩家存在
                            const name = await GamePrompt(
                                "Enter your friend's name:"
                            );
                            if (!name) {
                                throw new Error("name is empty");
                            }
                            const friends =
                                JSON.parse(
                                    localStorage.getItem("friendList")
                                ) || [];
                            friends.push({ address, name });
                            localStorage.setItem(
                                "friendList",
                                JSON.stringify(friends)
                            );
                            await loadRankAndFriends();
                        } catch (e) {
                            GameAlert("Please enter the right address");
                        }
                    });
            } catch (e) {
                console.error(e);
                GameAlert("There Are Some Error");
                navigateTo(`/`);
            }
        },
    },
];

//游戏中逻辑-去除ready按钮-显示give up按钮-给canvas添加点击事件-轮询监听事件
async function intoGame(gameState, contract, provider) {
    console.log("intoGame");
    document.querySelector(".ready_btn").remove();
    if (gameState === 1 || gameState === 2) {
        document.querySelector(".give_up_btn").style.display = "inline";
        document
            .querySelector(".give_up_btn")
            .addEventListener("click", async () => {
                try {
                    changeLog(`give up`, 0);
                    const tx = await CONTRACT.giveUp();
                    const receipt = await tx.wait();
                    if (receipt.status === 1) {
                        changeLog(`give up`, 1);
                        console.log("give up ok");
                    } else {
                        changeLog(`give up`, -1);
                        console.log("give up error");
                    }
                } catch (e) {
                    console.error(e);
                    changeLog(`give up`, -1);
                }
            });
        document
            .querySelector("#game_canvas")
            .addEventListener("click", async (event) => {
                try {
                    if (await checkIfYourTurn(CONTRACT, WALLET)) {
                        const x = event.offsetX;
                        const y = event.offsetY;
                        const gridSize = 32;
                        const boardX = Math.round(x / gridSize);
                        const boardY = Math.round(y / gridSize);
                        console.log(`position:(${boardX}, ${boardY})`);
                        changeLog(`send new step`, 0);
                        const tx = await CONTRACT.newStep(boardY, boardX);
                        const receipt = await tx.wait();
                        if (receipt.status === 1) {
                            changeLog(`send new step success`, 1);
                            console.log("newStep ok");
                        } else {
                            changeLog(`send new step error`, -1);
                            console.log("newStep error");
                        }
                    } else {
                        changeLog(`not your turn`, -1);
                        console.log("not your turn");
                        return;
                    }
                } catch (e) {
                    console.error(e);
                    changeLog(`send new step`, -1);
                }
            });
        pollEvent(contract, provider, "NewStep", async (args, event) => {
            console.log("NewStep", args);
            drawBoard(await getGameBoard(contract));
            printGameState(Number(await contract.gameState()));
        });
        pollEvent(contract, provider, "GameEnded", async (args, event) => {
            console.log("GameEnded", args);
            document.querySelector(".give_up_btn").remove();
            drawBoard(await getGameBoard(contract));
            printGameState(Number(await contract.gameState()), args[1]);
        });
    }
}

function printPlayerInfo(playerInfo, search = false) {
    const container = document.querySelector(".account_info.basic");
    const gameLinks = Array.from(playerInfo[1])
        .slice(-10)
        .map((i) => Number(i))
        .map((i) => {
            return `<a href="javascript:void(0)" class="game-link" data-gameid="${i}">${i}</a>`;
        })
        .join(" | ");

    container.innerHTML = `
    <p>${
        search ? "Search Result:" : "Welcome! Your account information:"
    }<br/>address: ${checkIfFriendAddress(playerInfo[0])}</p>
    <p>Last 10 games:</p>${gameLinks}
    <p>wins: ${playerInfo[2]} times &nbsp;&nbsp; loss: ${
        playerInfo[3]
    } times</p>
  `;
    container.querySelectorAll(".game-link").forEach((el) => {
        el.addEventListener("click", () => {
            const gameId = el.dataset.gameid;
            navigateTo(`/game/${gameId}`);
        });
    });
}

async function printTotalInfo() {
    const total = await MENU_CONTRACT.getTotalGamesAndTotalPlayers();
    document.querySelector(".total_info").textContent = `total game: ${Number(
        total[0]
    )}|total player: ${Number(total[1])}`;
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

async function loadRankAndFriends() {
    const topPlayers = await MENU_CONTRACT.getTopPlayers();
    Array.from(topPlayers).forEach((i) => {
        const el = document.createElement("li");
        el.addEventListener("click", () => {
            printPlayerInfo(i, true);
        });
        el.innerHTML = `${checkIfFriendAddress(i[0])}-${i[2]}wins`;
        document.querySelector(".rank").appendChild(el);
    });
    const friends = JSON.parse(localStorage.getItem("friendList")) || [];
    //console.log(friends);
    friends.forEach((i) => {
        const el = document.createElement("li");
        el.innerHTML = `${checkIfFriendAddress(i.address)}-${i.name}`;
        el.addEventListener("click", async () => {
            printPlayerInfo(await MENU_CONTRACT.getPlayerInfo(i.address), true);
        });
        document.querySelector(".friends").appendChild(el);
    });
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
