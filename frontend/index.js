const container = document.querySelector(".main_container");

const routes = [
    {
        path: /^\/$/,
        view: () => `
        <input type="number" id="game_id"/>
        <button class='game_btn'>join the game</button>
        `,
        func: () => {
            document
                .querySelector(".game_btn")
                .addEventListener("click", () => {
                    const id = document.querySelector("#game_id").value;
                    //console.log(id);
                    navigateTo(`/game/${id}`);
                });
        },
    },
    {
        path: /^\/game\/(\d+)$/,
        view: (match) => `game page id: ${match[1]}`,
        func: () => {
            console.log("game page");
        },
    },
];

function router() {
    const path = window.location.pathname;
    for (let route of routes) {
        const match = path.match(route.path);
        if (match) {
            container.innerHTML = route.view(match);
            route.func && route.func();
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

router();
