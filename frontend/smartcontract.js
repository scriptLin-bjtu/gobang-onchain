import { ethers, Wallet } from "ethers";

export const ABI = [
    "function gameId() view returns (uint256)",
    "function p1address() view returns (address)",
    "function p2address() view returns (address)",
    "function getGameBoard() view returns (uint8[16][16] memory)",
    "function gameState() view returns (uint256)",
    "function startGame()",
    "function newStep(uint8 x, uint8 y)",
    "event GameStarted(address indexed player1, address indexed player2)",
    "event NewStep(address indexed player, uint8 x, uint8 y)",
    "event GameEnded(address indexed winner, string reason)",
    "function giveUp()",
];

export const MENU_ABI = [
    "event GameCreated(uint256 gameId, address player1, address player2)",
    "event AccountCreated(address playerAddress)",
    "function getPlayerInfo(address playerAddress) view returns (tuple(address playerAddress, uint256[] gameIds, uint256 winTimes, uint256 loseTimes))",
    "function registerPlayer(address playerAddress)",
    "function createGame(address player1, address player2)",
    "function getGameAddress(uint256 gameId) view returns (address)",
    "function getTopPlayers() view returns (tuple(address playerAddress, uint256[] gameIds, uint256 winTimes, uint256 loseTimes)[])",
    "function getTotalGamesAndTotalPlayers() view returns (uint256, uint256)",
];

export function connectToProvider(RPC_URL) {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    return provider;
}

export function connectToWallet(PRIVATE_KEY, PROVIDER) {
    const wallet = new Wallet(PRIVATE_KEY, PROVIDER);
    return wallet;
}

export function connectToContract(contractAddr, ABI, wallet) {
    const contract = new ethers.Contract(contractAddr, ABI, wallet);
    return contract;
}

export async function checkWalletTrue(wallet, contract, gameId) {
    const addr1 = await contract.p1address();
    const addr2 = await contract.p2address();
    const gameid = await contract.gameId();
    if (gameid == gameId) {
        if (wallet.address == addr1) return 1;
        if (wallet.address == addr2) return 2;
    }
    return -1;
}

export async function checkIfYourTurn(contract, wallet) {
    const gameState = await contract.gameState();
    const addr1 = await contract.p1address();
    const addr2 = await contract.p2address();
    if (gameState == 1 && wallet.address == addr1) return true;
    if (gameState == 2 && wallet.address == addr2) return true;
    return false;
}

export async function getGameBoard(contract) {
    const gameBoard = await contract.getGameBoard();
    const board = gameBoard.map((row) =>
        Array.from(row).map((cell) => Number(cell))
    );
    return board;
}

export function pollEvent(
    contract,
    provider,
    eventName,
    callback,
    pollInterval = 5000
) {
    let lastCheckedBlock = 0;

    async function check() {
        try {
            const latestBlock = await provider.getBlockNumber();

            if (lastCheckedBlock === 0) {
                lastCheckedBlock = latestBlock;
            }

            const filter = contract.filters[eventName]();
            const events = await contract.queryFilter(
                filter,
                lastCheckedBlock + 1,
                latestBlock
            );

            console.log("Found events:", events);

            for (const e of events) {
                callback(e.args, e);
            }

            lastCheckedBlock = latestBlock;
        } catch (err) {
            console.error("pollEvent error:", err);
        } finally {
            setTimeout(check, pollInterval);
        }
    }

    check();
}

export function createAccount() {
    const wallet = ethers.Wallet.createRandom();
    //console.log("address :", wallet.address);
    //console.log("private :", wallet.privateKey);
    return { address: wallet.address, privateKey: wallet.privateKey };
}
