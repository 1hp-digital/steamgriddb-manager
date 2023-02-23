import getLoggedInUser from "./getLoggedInUser";
import getCurrentUserGridPath from "./getCurrentUserGridPath";
import getLeveldbPath from "./getLeveldbPath";
import generateNewAppId from "./generateNewAppId";

const fs = window.require("fs");
const {join} = window.require("path");
const VDF = window.require("@node-steam/vdf");
const log = window.require("electron-log");
const Categories = window.require("steam-categories");

const addCategory = async (games, categoryId):Promise<void> => {
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
};

export default addCategory;
