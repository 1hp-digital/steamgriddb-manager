import getShortcutFile from "./getShortcutFile";
import generateNewAppId from "./generateNewAppId";
import {Game} from "../../types";

const shortcut = window.require("steam-shortcut-editor");
const {metrohash64} = window.require("metrohash");
const Store = window.require("electron-store");

export interface NonSteamGames {
    [key: string]: Game[];
}

const getNonSteamGames = async ():Promise<NonSteamGames> => {
    const shortcutPath = await getShortcutFile();

    return new Promise((resolve) => {
        const store = new Store();

        const processed = [];
        shortcut.parseFile(shortcutPath, (err, items) => {
            const games:NonSteamGames = {};

            if (!items) {
                return resolve(games);
            }

            items.shortcuts.forEach((item) => {
                const appName = item.appname || item.AppName || item.appName;
                const exe = item.exe || item.Exe;
                const configId = metrohash64(exe + item.LaunchOptions);
                const appid = (item.appid) ?
                    (item.appid >>> 0) : // bitwise unsigned 32 bit ID of manually added non-steam game
                    generateNewAppId(exe, appName);


                if (store.has(`games.${configId}`)) {
                    const storedGame = store.get(`games.${configId}`);
                    if (typeof games[storedGame.platform] === "undefined") {
                        games[storedGame.platform] = [];
                    }

                    if (!processed.includes(configId)) {
                        games[storedGame.platform].push({
                            gameId: storedGame.id,
                            name: appName,
                            platform: storedGame.platform,
                            type: "shortcut",
                            appid,
                        });
                        processed.push(configId);
                    }
                } else {
                    if (!games.other) {
                        games.other = [];
                    }

                    games.other.push({
                        gameId: null,
                        name: appName,
                        platform: "other",
                        type: "shortcut",
                        appid,
                    });
                }
            });
            return resolve(games);
        });
    });
};

export default getNonSteamGames;
