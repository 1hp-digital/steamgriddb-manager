import getSteamPath from "./getSteamPath";
import {Game} from "../types";

const fs = window.require("fs");
const {join} = window.require("path");
const VDF = window.require("@node-steam/vdf");
const log = window.require("electron-log");

interface LibraryFolder {
    apps: {
        [key:number]: number
    },
    contentid: number,
    label: string,
    path: string,
    time_last_update_corruption: number,
    totalsize: number,
    mounted: 0|1
}

interface ParsedLibraryFolders {
    LibraryFolders?: LibraryFolder[],
    libraryfolders?: LibraryFolder[]
}

const getSteamGames = async ():Promise<Game[]> => {
    const steamPath = await getSteamPath();

    return new Promise((resolve) => {
        const parsedLibFolders:ParsedLibraryFolders = VDF.parse(fs.readFileSync(join(steamPath, "steamapps", "libraryfolders.vdf"), "utf-8"));
        const games:Game[] = [];

        // Load  library paths from libraryfolders.vdf
        const libraries = Object.entries(parsedLibFolders.LibraryFolders || parsedLibFolders.libraryfolders)
            .filter(([key]) => !Number.isNaN(parseInt(key, 10)))
            .filter(([, library]) => typeof library === "string" || library.mounted !== 0)
            .map(([, library]) => typeof library === "string" ? library : library.path);

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
};

export default getSteamGames;
