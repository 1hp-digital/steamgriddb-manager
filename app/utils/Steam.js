import getLoggedInUser from "./steam/getLoggedInUser";
import getCurrentUserGridPath from "./steam/getCurrentUserGridPath";
import generateNewAppId from "./steam/generateNewAppId";
import getShortcutFile from "./steam/getShortcutFile";
import getLeveldbPath from "./steam/getLeveldbPath";
import generateAppId from "./steam/generateAppId";

const fs = window.require("fs");
const {join} = window.require("path");
const VDF = window.require("@node-steam/vdf");
const shortcut = window.require("steam-shortcut-editor");
const log = window.require("electron-log");
const Categories = window.require("steam-categories");

class Steam {
    constructor() {
        this.loggedInUser = null;
        this.currentUserGridPath = null;
    }

    static async addShortcuts(shortcuts) {
        const shortcutPath = await getShortcutFile();

        return new Promise((resolve) => {
            shortcut.parseFile(shortcutPath, (err, items) => {
                const newShorcuts = {
                    shortcuts: [],
                };

                let apps = [];
                if (typeof items !== "undefined") {
                    apps = items.shortcuts;
                }

                shortcuts.forEach((value) => {
                    // Don't add dupes
                    apps.some((app) => {
                        const appid = generateAppId(app.exe, app.appname);
                        if (generateAppId(value.exe, value.name) === appid) {
                            return true;
                        }
                        return false;
                    });

                    apps.push({
                        appname: value.name,
                        exe: value.exe,
                        StartDir: value.startIn,
                        LaunchOptions: value.params,
                        icon: (typeof value.icon !== "undefined" ? value.icon : ""),
                        IsHidden: false,
                        ShortcutPath: "",
                        AllowDesktopConfig: true,
                        OpenVR: false,
                        tags: (typeof value.tags !== "undefined" ? value.tags : []),
                    });
                });

                newShorcuts.shortcuts = apps;

                shortcut.writeFile(shortcutPath, newShorcuts, () => resolve());
            });
        });
    }

    static async addCategory(games, categoryId) {
        const user = await getLoggedInUser();
        const userGridPath = await getCurrentUserGridPath();

        return new Promise((resolve, reject) => {
            const levelDBPath = getLeveldbPath();

            const cats = new Categories(levelDBPath, String(user));

            cats.read().then(() => {
                const localConfigPath = join(userGridPath, "../", "localconfig.vdf");
                const localConfig = VDF.parse(fs.readFileSync(localConfigPath, "utf-8"));

                let collections = {};
                if (localConfig.UserLocalConfigStore.WebStorage["user-collections"]) {
                    collections = JSON.parse(localConfig.UserLocalConfigStore.WebStorage["user-collections"].replace(/\\/g, ""));
                }

                games.forEach((app) => {
                    const platformName = categoryId;
                    const appId = generateNewAppId(app.exe, app.name);

                    // Create new category if it doesn't exist
                    const catKey = `sgdb-${platformName}`; // just use the name as the id
                    const platformCat = cats.get(catKey);
                    if (platformCat.is_deleted || !platformCat) {
                        cats.add(catKey, {
                            name: platformName,
                            added: [],
                        });
                    }

                    // Create entry in localconfig.vdf
                    if (!collections[catKey]) {
                        collections[catKey] = {
                            id: catKey,
                            added: [],
                            removed: [],
                        };
                    }

                    // Add appids to localconfig.vdf
                    if (collections[catKey].added.indexOf(appId) === -1) {
                        // Only add if it doesn't exist already
                        collections[catKey].added.push(appId);
                    }
                });

                cats.save().then(() => {
                    localConfig.UserLocalConfigStore.WebStorage["user-collections"] = JSON.stringify(collections).replace(/"/g, "\\\""); // I hate Steam

                    const newVDF = VDF.stringify(localConfig);

                    try {
                        fs.writeFileSync(localConfigPath, newVDF);
                    } catch (e) {
                        log.error("Error writing categories file");
                        console.error(e);
                    }

                    cats.close();
                    return resolve();
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
}

export default Steam;
