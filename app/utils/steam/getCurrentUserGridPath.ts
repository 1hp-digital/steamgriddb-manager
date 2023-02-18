import getSteamPath from "./getSteamPath";
import getLoggedInUser from "./getLoggedInUser";

const fs = window.require("fs");
const {join} = window.require("path");

let cache:string;

const getCurrentUserGridPath = async ():Promise<string> => {
    const steamPath = await getSteamPath();
    const user = await getLoggedInUser();

    return new Promise((resolve) => {
        if (cache) {
            return resolve(cache);
        }

        const gridPath = join(steamPath, "userdata", String(user), "config", "grid");

        if (!fs.existsSync(gridPath)) {
            fs.mkdirSync(gridPath);
        }

        cache = gridPath;
        resolve(gridPath);
    });
};

export default getCurrentUserGridPath;
