const {join} = window.require("path");
const fs = window.require("fs");

import getSteamPath from "./getSteamPath";
import getCustomImage from "./getCustomImage";
import getLoggedInUser from "./getLoggedInUser";
import {GameImages} from "../../types";

const getGameImages = async (game):Promise<GameImages> => {
    const steamPath = await getSteamPath();
    const user = await getLoggedInUser();

    return new Promise((resolve) => {
        const userdataGridPath = join(steamPath, "userdata", String(user), "config", "grid");

        let grid = getCustomImage("horizontalGrid", userdataGridPath, game.appid);
        let poster = getCustomImage("verticalGrid", userdataGridPath, game.appid);
        let hero = getCustomImage("hero", userdataGridPath, game.appid);
        let logo = getCustomImage("logo", userdataGridPath, game.appid);

        // Find defaults from the cache if it doesn't exist
        const librarycachePath = join(steamPath, "appcache", "librarycache");

        if (!grid && fs.existsSync(join(librarycachePath, `${game.appid}_header.jpg`))) {
            grid = join(librarycachePath, `${game.appid}_header.jpg`);
        }

        if (!poster && fs.existsSync(join(librarycachePath, `${game.appid}_library_600x900.jpg`))) {
            poster = join(librarycachePath, `${game.appid}_library_600x900.jpg`);
        }

        if (!hero && fs.existsSync(join(librarycachePath, `${game.appid}_library_hero.jpg`))) {
            hero = join(librarycachePath, `${game.appid}_library_hero.jpg`);
        }

        if (!logo && fs.existsSync(join(librarycachePath, `${game.appid}_logo.png`))) {
            logo = join(librarycachePath, `${game.appid}_logo.png`);
        }

        resolve({
            grid,
            poster,
            hero,
            logo,
        });
    });
};

export default getGameImages;
