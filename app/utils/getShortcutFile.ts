import getSteamPath from "./getSteamPath";
import getLoggedInUser from "./getLoggedInUser";
import {ShortcutFile} from "../types";
const {join} = window.require("path");

const getShortcutFile = async ():Promise<ShortcutFile> => {
    const steamPath = await getSteamPath();
    const user = await getLoggedInUser();

    return new Promise((resolve) => {
        const userdataPath = join(steamPath, "userdata", String(user));
        const shortcutPath = join(userdataPath, "config", "shortcuts.vdf");
        resolve(shortcutPath);
    });
};

export default getShortcutFile;
