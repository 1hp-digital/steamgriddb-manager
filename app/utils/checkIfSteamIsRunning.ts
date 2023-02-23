const Categories = window.require("steam-categories");

import getLeveldbPath from "./getLeveldbPath";
import getLoggedInUser from "./getLoggedInUser";

const checkIfSteamIsRunning = async ():Promise<boolean> => {
    const user = await getLoggedInUser();

    return new Promise((resolve) => {
        const levelDBPath = getLeveldbPath();
        const cats = new Categories(levelDBPath, String(user));

        /*
         * Without checking Windows processes directly, this is the most reliable way
         * to check if Steam is running. When Steam is running, there is a lock on
         * this file, so if we can't read it, that means Steam must be running.
         */
        cats.read()
            .then(() => {
                resolve(false);
            })
            .catch(() => {
                resolve(true);
            })
            .finally(() => {
                cats.close();
            });
    });
};

export default checkIfSteamIsRunning;
