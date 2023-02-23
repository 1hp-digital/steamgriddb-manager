import SteamID from "steamid";
import {crc32} from "crc";
import getSteamPath from "./steam/getSteamPath";
import getLoggedInUser from "./steam/getLoggedInUser";
import getCurrentUserGridPath from "./steam/getCurrentUserGridPath";
import generateNewAppId from "./steam/generateNewAppId";
import getShortcutFile from "./steam/getShortcutFile";
import getLeveldbPath from "./steam/getLeveldbPath";
import getCustomImage from "./steam/getCustomImage";

const fs = window.require("fs");
const {join, extname} = window.require("path");
const VDF = window.require("@node-steam/vdf");
const shortcut = window.require("steam-shortcut-editor");
const https = window.require("https");
const Stream = window.require("stream").Transform;
const log = window.require("electron-log");
const Categories = window.require("steam-categories");
const glob = window.require("glob");

class Steam {
    constructor() {
        this.loggedInUser = null;
        this.currentUserGridPath = null;
    }

    /* eslint-disable no-bitwise, no-mixed-operators */
    static generateAppId(exe, name) {
        const key = exe + name;
        const top = BigInt(crc32(key)) | BigInt(0x80000000);
        return String((BigInt(top) << BigInt(32) | BigInt(0x02000000)));
    }
    /* eslint-enable no-bitwise, no-mixed-operators */

    static async addAsset(type, appId, url) {
        const userGridPath = await getCurrentUserGridPath();

        return new Promise((resolve, reject) => {
            const imageUrl = url;
            const imageExt = extname(imageUrl);

            let dest;

            switch (type) {
                case "horizontalGrid":
                    dest = join(userGridPath, `${appId}${imageExt}`);
                    break;
                case "verticalGrid":
                    dest = join(userGridPath, `${appId}p${imageExt}`);
                    break;
                case "hero":
                    dest = join(userGridPath, `${appId}_hero${imageExt}`);
                    break;
                case "logo":
                    dest = join(userGridPath, `${appId}_logo${imageExt}`);
                    break;
                default:
                    reject();
            }

            let cur = 0;
            const data = new Stream();
            let progress = 0;
            let lastProgress = 0;
            https.get(url, (response) => {
                const len = parseInt(response.headers["content-length"], 10);

                response.on("data", (chunk) => {
                    cur += chunk.length;
                    data.push(chunk);
                    progress = Math.round((cur / len) * 10) / 10;
                    if (progress !== lastProgress) {
                        lastProgress = progress;
                    }
                });

                response.on("end", () => {
                    // Delete old image(s)
                    glob(`${dest.replace(imageExt, "")}.*`, (er, files) => {
                        files.forEach((file) => {
                            fs.unlinkSync(file);
                        });

                        fs.writeFileSync(dest, data.read());
                        resolve(dest);
                    });
                });
            }).on("error", (err) => {
                fs.unlink(dest);
                reject(err);
            });
        });
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
                        const appid = this.generateAppId(app.exe, app.appname);
                        if (this.generateAppId(value.exe, value.name) === appid) {
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
