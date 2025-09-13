// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract Game {
    uint256 public gameId;
    uint8 public gameState;
    //gamestate 0 not start 1player1 2player2 3 player1win 4 player2win
    uint8[16][16] public gameBoard;
    address public p1address;
    address public p2address;
    Player private player1;
    Player private player2;

    struct Player {
        address playerAddress;
        uint8 playerState;
        /**
        playerState
        0 not ready
        1 your turn
        2 opponent turn
        3 win
        4 lose
         */
    }

    event GameStarted(address indexed player1, address indexed player2);

    event NewStep(address indexed player, uint8 x, uint8 y);

    event GameEnded(address indexed winner, string reason);

    constructor(uint256 _gameId, address a1, address a2) {
        gameId = _gameId;
        player1 = Player(a1, 0);
        player2 = Player(a2, 0);
        p1address = a1;
        p2address = a2;
    }

    function getRole(address p1, address p2) private view returns (uint8) {
        if (p1 == msg.sender) {
            return 1;
        } else if (p2 == msg.sender) {
            return 2;
        } else {
            return 0;
        }
    }

    function getGameBoard() external view returns (uint8[16][16] memory) {
        return gameBoard;
    }

    function lineStatus(
        uint8[16][16] storage board,
        uint8 x,
        uint8 y,
        int8 dx,
        int8 dy,
        uint8 role
    ) internal view returns (uint8 count, bool leftEmpty, bool rightEmpty) {
        count = 0;

        // 正方向
        int8 i = int8(x) + dx;
        int8 j = int8(y) + dy;
        while (
            i >= 0 &&
            i < 16 &&
            j >= 0 &&
            j < 16 &&
            board[uint8(i)][uint8(j)] == role
        ) {
            count++;
            i += dx;
            j += dy;
        }
        rightEmpty = (i >= 0 &&
            i < 16 &&
            j >= 0 &&
            j < 16 &&
            board[uint8(i)][uint8(j)] == 0);

        // 反方向
        i = int8(x) - dx;
        j = int8(y) - dy;
        while (
            i >= 0 &&
            i < 16 &&
            j >= 0 &&
            j < 16 &&
            board[uint8(i)][uint8(j)] == role
        ) {
            count++;
            i -= dx;
            j -= dy;
        }
        leftEmpty = (i >= 0 &&
            i < 16 &&
            j >= 0 &&
            j < 16 &&
            board[uint8(i)][uint8(j)] == 0);

        // 最后把中心子补回来
        count += 1;
    }

    function isForbidden(
        uint8[16][16] storage board,
        uint8 x,
        uint8 y,
        uint8 role
    ) internal view returns (bool) {
        if (role != 1) return false; // 白棋无禁手

        int8[4] memory dx = [int8(1), 0, 1, 1];
        int8[4] memory dy = [int8(0), 1, 1, -1];

        uint8 openThree = 0;
        uint8 openFour = 0;

        for (uint8 d = 0; d < 4; d++) {
            (uint8 cnt, bool leftEmpty, bool rightEmpty) = lineStatus(
                board,
                x,
                y,
                dx[d],
                dy[d],
                role
            );

            // 活三：恰好 3 子且两端空
            if (cnt == 3 && leftEmpty && rightEmpty) openThree++;

            // 冲四：恰好 4 子且至少一端空（另一端已堵或边界）
            if (cnt == 4 && (leftEmpty || rightEmpty)) openFour++;

            // 提前短路，已构成禁手
            if (openThree >= 2 || openFour >= 2) return true;
        }

        return false;
    }

    function judge(uint8 x, uint8 y, uint8 role) private view returns (int8) {
        // --------- 1. 黑棋禁手检测 ---------
        if (isForbidden(gameBoard, x, y, role)) {
            return -1;
        }

        // --------- 2. 五连子检测 ---------
        int8[4] memory dx = [int8(1), 0, 1, 1];
        int8[4] memory dy = [int8(0), 1, 1, -1];

        for (uint8 d = 0; d < 4; ++d) {
            uint8 cnt = 1; // 包含刚下的子
            int8 xi = int8(x) + dx[d];
            int8 yi = int8(y) + dy[d];

            // 正方向
            while (
                xi >= 0 &&
                xi < 16 &&
                yi >= 0 &&
                yi < 16 &&
                gameBoard[uint8(xi)][uint8(yi)] == role
            ) {
                cnt++;
                xi += dx[d];
                yi += dy[d];
            }

            // 反方向
            xi = int8(x) - dx[d];
            yi = int8(y) - dy[d];
            while (
                xi >= 0 &&
                xi < 16 &&
                yi >= 0 &&
                yi < 16 &&
                gameBoard[uint8(xi)][uint8(yi)] == role
            ) {
                cnt++;
                xi -= dx[d];
                yi -= dy[d];
            }

            if (cnt >= 5) {
                return role == 1 ? int8(1) : int8(2);
            }
        }

        return 0;
    }

    function startGame() public {
        if (gameState != 0) {
            revert("game has started");
        }
        uint8 role = getRole(player1.playerAddress, player2.playerAddress);
        if (
            (role == 1 && player1.playerState == 1) ||
            (role == 2 && player2.playerState == 2)
        ) {
            revert("you already readyed");
        }
        if (role == 1 && player1.playerState == 0) {
            player1.playerState = 1;
        }
        if (role == 2 && player2.playerState == 0) {
            player2.playerState = 2;
        }
        if (player1.playerState == 1 && player2.playerState == 2) {
            gameState = 1;
            emit GameStarted(player1.playerAddress, player2.playerAddress);
        }
    }

    function newStep(uint8 x, uint8 y) public {
        uint8 role = getRole(player1.playerAddress, player2.playerAddress);
        require(
            role != 0 &&
                (gameState == 1 || gameState == 2) &&
                x < 16 &&
                y < 16 &&
                gameBoard[x][y] == 0,
            "Error new step"
        );
        gameBoard[x][y] = role;
        int8 result = judge(x, y, role);
        if (result == -1) {
            gameBoard[x][y] = 0;
            revert("wrong step player1");
        } else if (result == 0) {
            if (role == 1 && player1.playerState == 1) {
                player1.playerState = 2;
                player2.playerState = 1;
                gameState = 2;
                emit NewStep(player1.playerAddress, x, y);
            }
            if (role == 2 && player2.playerState == 1) {
                player1.playerState = 1;
                player2.playerState = 2;
                gameState = 1;
                emit NewStep(player2.playerAddress, x, y);
            }
            return;
        } else if (result == 1) {
            player1.playerState = 3;
            player2.playerState = 4;
            gameState = 3;
            emit GameEnded(player1.playerAddress, "player1 win");
        } else if (result == 2) {
            player1.playerState = 4;
            player2.playerState = 3;
            gameState = 4;
            emit GameEnded(player2.playerAddress, "player2 win");
        }
    }

    function giveUp() public {
        uint8 role = getRole(player1.playerAddress, player2.playerAddress);
        require(
            role != 0 && (gameState == 1 || gameState == 2),
            "Error give up"
        );
        if (role == 1) {
            player1.playerState = 4;
            player2.playerState = 3;
            gameState = 4;
            emit GameEnded(player2.playerAddress, "player1 give up");
        }
        if (role == 2) {
            player1.playerState = 3;
            player2.playerState = 4;
            gameState = 3;
            emit GameEnded(player1.playerAddress, "player2 give up");
        }
    }
}
