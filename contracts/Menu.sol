// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "./Game.sol";
contract Menu {
    struct PlayerInfo {
        address playerAddress;
        uint256[] gameIds;
        uint256 winTimes;
        uint256 loseTimes;
    }
    mapping(address => PlayerInfo) private AllPlayerData;
    Game[] private gameList; //index=gameId from 0
    address[] private playerList;

    event GameCreated(uint256 gameId, address player1, address player2);
    event AccountCreated(address playerAddress);

    function getPlayerInfo(
        address playerAddress
    ) public view returns (PlayerInfo memory) {
        require(
            AllPlayerData[playerAddress].playerAddress != address(0),
            "Player not registered"
        );
        return AllPlayerData[playerAddress];
    }

    function getGameCounts() public view returns (uint256) {
        return gameList.length;
    }

    function getPlayerCounts() public view returns (uint256) {
        return playerList.length;
    }

    function registerPlayer(address playerAddress) public {
        require(
            AllPlayerData[playerAddress].playerAddress == address(0),
            "Player already registered"
        );
        require(playerAddress != address(0), "Invalid player address");
        require(playerAddress.balance >= 0.1 ether, "Insufficient balance");
        AllPlayerData[playerAddress] = PlayerInfo(
            playerAddress,
            new uint256[](0),
            0,
            0
        );
        playerList.push(playerAddress);
        emit AccountCreated(playerAddress);
    }

    function createGame(address player1, address player2) public {
        require(
            msg.sender == player1 || msg.sender == player2,
            "Only player can create game"
        );
        require(player1 != player2, "Player1 and Player2 can't be the same");
        require(
            AllPlayerData[player1].playerAddress != address(0) &&
                AllPlayerData[player2].playerAddress != address(0),
            "Player not registered"
        );
        for (uint256 i = 0; i < AllPlayerData[player1].gameIds.length; i++) {
            if (
                gameList[AllPlayerData[player1].gameIds[i]].gameState() < 3 &&
                gameList[AllPlayerData[player1].gameIds[i]].gameState() > 0
            ) {
                //on game
                revert("Player1 is on game");
            }
        }
        for (uint256 i = 0; i < AllPlayerData[player2].gameIds.length; i++) {
            if (
                gameList[AllPlayerData[player2].gameIds[i]].gameState() > 0 &&
                gameList[AllPlayerData[player2].gameIds[i]].gameState() < 3
            ) {
                //on game
                revert("Player2 is on game");
            }
        }
        uint gameId = gameList.length;
        AllPlayerData[player1].gameIds.push(gameId);
        AllPlayerData[player2].gameIds.push(gameId);
        gameList.push(new Game(gameId, player1, player2, address(this)));
        emit GameCreated(gameId, player1, player2);
    }

    function getGameAddress(uint256 gameId) public view returns (address) {
        return address(gameList[gameId]);
    }

    function getTopPlayers() public view returns (PlayerInfo[] memory) {
        uint n = playerList.length;
        uint topN = n < 10 ? n : 10;

        PlayerInfo[] memory players = new PlayerInfo[](n);
        for (uint i = 0; i < n; i++) {
            players[i] = AllPlayerData[playerList[i]];
        }

        for (uint i = 0; i < topN; i++) {
            uint maxIndex = i;
            for (uint j = i + 1; j < n; j++) {
                if (players[j].winTimes > players[maxIndex].winTimes) {
                    maxIndex = j;
                }
            }
            if (maxIndex != i) {
                PlayerInfo memory temp = players[i];
                players[i] = players[maxIndex];
                players[maxIndex] = temp;
            }
        }

        PlayerInfo[] memory topPlayers = new PlayerInfo[](topN);
        for (uint i = 0; i < topN; i++) {
            topPlayers[i] = players[i];
        }

        return topPlayers;
    }

    function getTotalGamesAndTotalPlayers()
        public
        view
        returns (uint256, uint256)
    {
        return (gameList.length, playerList.length);
    }

    function updateResult(
        uint256 gameId,
        address winner,
        address loser
    ) external {
        require(msg.sender == address(gameList[gameId]), "Not authorized game");
        AllPlayerData[winner].winTimes++;
        AllPlayerData[loser].loseTimes++;
    }
}
