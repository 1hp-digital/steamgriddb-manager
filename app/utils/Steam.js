import SteamID from "steamid";
import { crc32 } from "crc";

const Registry = window.require("winreg");
const Store = window.require("electron-store");
const fs = window.require("fs");
const { join, extname } = window.require("path");
const VDF = window.require("@node-steam/vdf");
const shortcut = window.require("steam-shortcut-editor");
const https = window.require("https");
const Stream = window.require("stream").Transform;
const { metrohash64 } = window.require("metrohash");
const log = window.require("electron-log");
const Categories = window.require("steam-categories");
const glob = window.require("glob");

class Steam {
    constructor() {
        this.loggedInUser = null;
        this.currentUserGridPath = null;
    }

    static async getSteamPath() {
        return new Promise((resolve, reject) => {
            if (this.steamPath) {
                return resolve(this.steamPath);
            }

            const key = new Registry({
                hive: Registry.HKCU,
                key: "\\Software\\Valve\\Steam",
            });

            key.values((err, items) => {
                let steamPath = false;

                items.forEach((item) => {
                    if (item.name === "SteamPath") {
                        steamPath = item.value;
                    }
                });

                if (steamPath) {
                    this.steamPath = steamPath;
                    log.info(`Got Steam path: ${steamPath}`);
                    return resolve(steamPath);
                }

                return reject(new Error("Could not find Steam path."));
            });

            return false;
        });
    }

    static async getCurrentUserGridPath() {
        const steamPath = await this.getSteamPath();
        const user = await this.getLoggedInUser();

        return new Promise((resolve) => {
            if (this.currentUserGridPath) {
                return resolve(this.currentUserGridPath);
            }
            const gridPath = join(steamPath, "userdata", String(user), "config", "grid");
            if (!fs.existsSync(gridPath)) {
                fs.mkdirSync(gridPath);
            }
            this.currentUserGridPath = gridPath;
            resolve(gridPath);
        });
    }

    static async getGameImages(game) {
        const steamPath = await this.getSteamPath();
        const user = await this.getLoggedInUser();

        return new Promise((resolve) => {
            const userdataGridPath = join(steamPath, "userdata", String(user), "config", "grid");

            let grid = Steam.getCustomImage("horizontalGrid", userdataGridPath, game.appid);
            let poster = Steam.getCustomImage("verticalGrid", userdataGridPath, game.appid);
            let hero = Steam.getCustomImage("hero", userdataGridPath, game.appid);
            let logo = Steam.getCustomImage("logo", userdataGridPath, game.appid);

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
    }

    static async getSteamGames() {
        const steamPath = await this.getSteamPath();

        return new Promise((resolve) => {
            const parsedLibFolders = VDF.parse(fs.readFileSync(join(steamPath, "steamapps", "libraryfolders.vdf"), "utf-8"));
            const games = [];

            // Load extra library paths from libraryfolders.vdf
            const extraLibraries = Object.entries(parsedLibFolders.LibraryFolders || parsedLibFolders.libraryfolders || {})
                .filter(([key]) => !Number.isNaN(parseInt(key, 10)))
            // eslint-disable-next-line no-unused-vars
                .filter(([_, library]) => typeof library === "string" || library.mounted !== 0)
            // eslint-disable-next-line no-unused-vars
                .map(([_, library]) => typeof library === "string" ? library : library.path);

            // Add Steam install dir and extra libraries
            const libraries = [steamPath, ...extraLibraries];

            log.info(`Found ${libraries.length} Steam libraries`);

            libraries.forEach((library) => {
                const appsPath = join(library, "steamapps");
                const files = fs.readdirSync(appsPath);
                files.forEach((file) => {
                    const ext = file.split(".").pop();

                    if (ext === "acf") {
                        const filePath = join(appsPath, file);
                        const data = fs.readFileSync(filePath, "utf-8");
                        try {
                            const gameData = VDF.parse(data);
                            if (gameData.AppState.appid === 228980) {
                                return;
                            }

                            const game = {
                                appid: gameData.AppState.appid,
                                name: gameData.AppState.name,
                                type: "game",
                            };

                            games.push(game);
                        } catch (err) {
                            log.warn(`Error while parsing ${file}: ${err}`);
                        }
                    }
                });
            });
            log.info(`Fetched ${games.length} Steam games`);

            resolve(games);
        });
    }

    static async getNonSteamGames() {
        const steamPath = await this.getSteamPath();
        const user = await this.getLoggedInUser();

        return new Promise((resolve) => {
            const store = new Store();
            const userdataPath = join(steamPath, "userdata", String(user));
            const shortcutPath = join(userdataPath, "config", "shortcuts.vdf");
            const processed = [];
            shortcut.parseFile(shortcutPath, (err, items) => {
                const games = {};

                if (!items) {
                    return resolve([]);
                }

                items.shortcuts.forEach((item) => {
                    const appName = item.appname || item.AppName || item.appName;
                    const exe = item.exe || item.Exe;
                    const configId = metrohash64(exe + item.LaunchOptions);
                    const appid = (item.appid) ?
                        (item.appid >>> 0) : //bitwise unsigned 32 bit ID of manually added non-steam game
                        this.generateNewAppId(exe, appName);


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
    }

    /* eslint-disable no-bitwise, no-mixed-operators */
    static generateAppId(exe, name) {
        const key = exe + name;
        const top = BigInt(crc32(key)) | BigInt(0x80000000);
        return String((BigInt(top) << BigInt(32) | BigInt(0x02000000)));
    }

    // Appid for new library.
    // Thanks to https://gist.github.com/stormyninja/6295d5e6c1c9c19ab0ce46d546e6d0b1 & https://gitlab.com/avalonparton/grid-beautification
    static generateNewAppId(exe, name) {
        const key = exe + name;
        const top = BigInt(crc32(key)) | BigInt(0x80000000);
        const shift = (BigInt(top) << BigInt(32) | BigInt(0x02000000)) >> BigInt(32);
        return parseInt(shift, 10);
    }
    /* eslint-enable no-bitwise, no-mixed-operators */

    static async getLoggedInUser() {
        const steamPath = await this.getSteamPath();

        return new Promise((resolve) => {
            if (this.loggedInUser) {
                return resolve(this.loggedInUser);
            }

            const loginusersPath = join(steamPath, "config", "loginusers.vdf");
            const data = fs.readFileSync(loginusersPath, "utf-8");
            const loginusersData = VDF.parse(data);

            Object.keys(loginusersData.users).forEach((user) => {
                if (loginusersData.users[user].MostRecent || loginusersData.users[user].mostrecent) {
                    const { accountid } = (new SteamID(user));
                    this.loggedInUser = accountid;
                    log.info(`Got Steam user: ${accountid}`);
                    resolve(accountid);
                    return true;
                }
                return false;
            });

            return false;
        });
    }

    static getDefaultGridImage(appid) {
        return `https://steamcdn-a.akamaihd.net/steam/apps/${appid}/header.jpg`;
    }

    static getCustomImage(type, userdataGridPath, appid) {
        const fileTypes = ["png", "jpg", "jpeg", "tga"];

        let basePath;
        switch (type) {
            case "horizontalGrid":
                basePath = join(userdataGridPath, `${String(appid)}`);
                break;
            case "verticalGrid":
                basePath = join(userdataGridPath, `${String(appid)}p`);
                break;
            case "hero":
                basePath = join(userdataGridPath, `${String(appid)}_hero`);
                break;
            case "logo":
                basePath = join(userdataGridPath, `${String(appid)}_logo`);
                break;
            default:
                basePath = join(userdataGridPath, `${String(appid)}`);
        }

        let image = false;
        fileTypes.some((ext) => {
            const path = `${basePath}.${ext}`;

            if (fs.existsSync(path)) {
                image = path;
                return true;
            }
            return false;
        });

        return image;
    }

    static async getShortcutFile() {
        const steamPath = await this.getSteamPath();
        const user = await this.getLoggedInUser();

        return new Promise((resolve) => {
            const userdataPath = join(steamPath, "userdata", String(user));
            const shortcutPath = join(userdataPath, "config", "shortcuts.vdf");
            resolve(shortcutPath);
        });
    }

    static async addAsset(type, appId, url) {
        const userGridPath = await this.getCurrentUserGridPath();

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

    static addShortcuts(shortcuts) {
        return new Promise((resolve) => {
            this.getShortcutFile().then((shortcutPath) => {
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
        });
    }

    static getLevelDBPath() {
        return join(process.env.localappdata, "Steam", "htmlcache", "Local Storage", "leveldb");
    }

    static async checkIfSteamIsRunning() {
        const user = await this.getLoggedInUser();

        return new Promise((resolve) => {
            const levelDBPath = this.getLevelDBPath();
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
    }

    static async addCategory(games, categoryId) {
        const user = await this.getLoggedInUser();
        const userGridPath = await this.getCurrentUserGridPath();

        return new Promise((resolve, reject) => {
            const levelDBPath = this.getLevelDBPath();

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
                    const appId = this.generateNewAppId(app.exe, app.name);

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
