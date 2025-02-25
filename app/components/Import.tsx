// @ts-nocheck
import React, {ReactElement, useEffect, useState} from "react";
import PubSub from "pubsub-js";
import {Icon} from "react-uwp";
import {isEqual} from "lodash";
import ImportList from "./ImportList";
import ImportAllButton from "./ImportAllButton";
import Spinner from "./Spinner";
import platforms from "../importers";
import {getTheme} from "react-uwp/Theme";
import generateNewAppId from "../utils/generateNewAppId";
import getNonSteamGames from "../utils/getNonSteamGames";
import checkIfSteamIsRunning from "../utils/checkIfSteamIsRunning";
import generateAppId from "../utils/generateAppId";
import addAsset from "../utils/addAsset";
import addShortcuts from "../utils/addShortcuts";
import addCategory from "../utils/addShortcut";
import {SteamGridDBImageData} from "../types";

import steamGridDB from "steamgriddb";

// const Store = window.require("electron-store");
// const MetroHash64 = window.require("metrohash").MetroHash64;
const log = window.require("electron-log");

const Import = ():ReactElement => {
    // const store = new Store();
    let checkSteamInterval = null;

    const SGDB = new steamGridDB("b971a6f5f280490ab62c0ee7d0fd1d16");
    let lastNonSteamGames = null;

    const [isLoaded, setIsLoaded] = useState(false);
    const [loadingText, setLoadingText] = useState("");
    const [installedPlatforms, setInstalledPlatforms] = useState([]);
    const [steamIsRunning, setSteamIsRunning] = useState(null);

    const theme = getTheme();

    useEffect(() => {
        log.info("Opened Import Page");

        void updateSteamIsRunning();
        checkSteamInterval = setInterval(updateSteamIsRunning, 1000);

        void getInstalledPlatforms();

        return () => {
            clearInterval(checkSteamInterval);
        };
    }, []);

    const getInstalledPlatforms = async ():Promise<void> => {
        debugger;
        const nonSteamGames = await getNonSteamGames();

        // appid: 4281517992
        // gameId: null
        // name: "Rocket League®"
        // platform: "other"
        // tags: ["Epic Games Launcher"]
        // type: "shortcut"
        // __proto__: Object

        console.log("nonSteamGames", nonSteamGames);
        // const platformGames = nonSteamGames.filter((game) => game.platformId == );

        if (!isEqual(nonSteamGames, lastNonSteamGames)) {
            log.info("Getting installed games for import list");

            setIsLoaded(false);

            lastNonSteamGames = nonSteamGames;

            Promise.all(platforms.map((platform) => platform.class.isInstalled()))
                .then((values) => {
                    // Set .installed
                    platforms.forEach((platform, index) => {
                        platform.installed = values[index];
                    });

                    const installedPlatforms = platforms.filter((platform) => (platform.installed));

                    console.log("installedPlatforms", installedPlatforms);

                    // Do .getGames() in sequential order
                    const getGames = installedPlatforms
                        .reduce((promise, platform) => promise.then(() => {
                            setLoadingText(`Grabbing games from ${platform.name}...`);

                            return platform.class.getGames()
                                .then((games) => {
                                    // Filter out any games that are already imported
                                    // @todo this section needs to be updates after changes to nonSteamGames
                                    // @todo filtering already added games is not working at all

                                    console.log("games", games);
                                    console.log("platform", platform);
                                    debugger;

                                    if (nonSteamGames) {
                                        games = games.filter((game) => {
                                            return !nonSteamGames.find((nonSteamGame) => {
                                                // @todo platform is being added as "other" instead of "egs"
                                                // @todo gameId is being added as null, appId is populated
                                                // @todo nonSteamGame.gameId for egs is something like "Sugar"
                                                return nonSteamGame.platform === platform.id && nonSteamGame.gameId === game.id;
                                            });
                                        });
                                    }

                                    // Populate games array
                                    platform.games = games;
                                });
                        })
                            .catch((err) => {
                                platform.error = true;
                                log.info(`Import: ${platform.id} rejected ${err}`);
                            }), Promise.resolve());

                    console.log("getGames", getGames);

                    getGames.then(() => {
                        setLoadingText("Getting images...");

                        const gridsPromises = [];
                        installedPlatforms.forEach((platform) => {
                            if (platform.games.length) {
                                // Get grids for each platform
                                const ids = platform.games.map((x) => encodeURIComponent(x.id));

                                const getGrids = SGDB.getGrids({
                                    type: platform.id,
                                    id: ids.join(","),
                                    dimensions: ["460x215", "920x430"]
                                })
                                    .then((res) => {
                                        platform.grids = _formatResponse(ids, res);
                                    })
                                    .catch((e) => {
                                        log.error("Erorr getting grids from SGDB");
                                        console.error(e);
                                        // @todo We need a way to log which game caused the error
                                        // @todo Fallback to text search
                                        // @todo show an error toast
                                    });

                                gridsPromises.push(getGrids);
                            }
                        });

                        // Update state after we got the grids
                        Promise.all(gridsPromises)
                            .then(() => {
                                setIsLoaded(true);
                                setInstalledPlatforms(installedPlatforms);
                            });
                    })
                        .catch((err) => {
                            log.info(`Import: ${err}`);
                        });
                });
        }
    };

    /*
   * @todo We might want to put this at the App level, and publish changes via PubSub or props,
   *   so different pages can display their own message if Steam is running.
   */
    const updateSteamIsRunning = async ():Promise<void> => {
        const steamIsRunningCheck = await checkIfSteamIsRunning();

        console.log("steamIsRunning", steamIsRunningCheck);

        if (steamIsRunningCheck !== steamIsRunning) {
            log.info(`Steam is ${steamIsRunningCheck ? "open" : "closed"}`);

            setSteamIsRunning(steamIsRunningCheck);

            // Update non-Steam games in case changes were made while Steam was open
            if (!steamIsRunningCheck) {
                setTimeout(() => {
                    getInstalledPlatforms();
                }, 0);
            }
        }
    };

    const saveImportedGames = (games):void => {
        // const gamesStorage = store.get("games", {});
        //
        // games.forEach((game) => {
        //     const key = game.exe + (
        //         typeof game.params !== "undefined"
        //             ? game.params
        //             : ""
        //     );
        //
        //     // const configId = new MetroHash64(key);
        //     const configId = "test";
        //     gamesStorage[configId] = game;
        // });
        //
        // store.set("games", gamesStorage);
    };

    // @todo this is horrible but can't be arsed right now
    const _formatResponse = (ids, res):SteamGridDBImageData[] => {
        let formatted = false;

        console.log("res", res);

        // if only single id then return first grid
        if (ids.length === 1) {
            if (res.length > 0) {
                formatted = [res[0]];
            }
        } else {
            // if multiple ids treat each object as a request
            formatted = res.map((x) => {
                if (x.success) {
                    if (x.data[0]) {
                        return x.data[0];
                    }
                }
                return false;
            });
        }

        console.log("formatted: ", formatted);
        return formatted;
    };

    const addGames = (games, platform):void => {
        saveImportedGames(games);

        const shortcuts = games.map((game) => ({
            name: game.name,
            exe: game.exe,
            startIn: game.startIn,
            params: game.params,
            tags: [platform.name],
            icon: game.icon
        }));

        addShortcuts(shortcuts).then(() => {
            addCategory(games, platform.name).then(() => {
                PubSub.publish("toast", {
                    logoNode: "ImportAll",
                    title: "Successfully Imported!",
                    contents: (
                        <p>
                            {games.length}
                            { " " }
                            games imported from
                            { " " }
                            {platform.name}
                        </p>
                    )
                });
            }).then(() => {
                // Download images
                PubSub.publish("toast", {
                    logoNode: "Download",
                    title: "Downloading Images...",
                    contents: (<p>Downloading images for imported games...</p>)
                });

                const ids = games.map((x) => encodeURIComponent(x.id));
                let posters = [];
                let heroes = [];
                let logos = [];

                // Get posters
                const getPosters = SGDB.getGrids({type: platform.id, id: ids.join(","), dimensions: ["600x900"]}).then((res) => {
                    posters = _formatResponse(ids, res);
                }).catch((e) => {
                    log.error("Error getting posters");
                    console.error(e);
                    // @todo show an error toast
                });

                // Get heroes
                const getHeroes = SGDB.getHeroes({type: platform.id, id: ids.join(",")}).then((res) => {
                    heroes = _formatResponse(ids, res);
                }).catch((e) => {
                    log.error("Error getting heroes");
                    console.error(e);
                    // @todo show an error toast
                });

                // Get heroes
                const getLogos = SGDB.getLogos({type: platform.id, id: ids.join(",")}).then((res) => {
                    logos = _formatResponse(ids, res);
                }).catch((e) => {
                    log.error("Error getting logos");
                    console.error(e);
                    // @todo show an error toast
                });

                Promise.all([getPosters, getHeroes, getLogos]).then(() => {
                    const downloadPromises = [];

                    games.forEach((game, i) => {
                        const appId = generateNewAppId(game.exe, game.name);

                        // Take (legacy) grids from when we got them for the ImportList
                        const savedGrid = platform.grids[platform.games.indexOf(games[i])];

                        if (platform.grids[i] && savedGrid) {
                            const appIdOld = generateAppId(game.exe, game.name);

                            downloadPromises.push(addAsset("horizontalGrid", appId, savedGrid.url));

                            // Old app id is for Big Picture Mode
                            downloadPromises.push(addAsset("horizontalGrid", appIdOld, savedGrid.url));
                        }

                        // Download posters
                        if (posters[i]) {
                            downloadPromises.push(addAsset("verticalGrid", appId, posters[i].url));
                        }

                        // Download heroes
                        if (heroes[i]) {
                            downloadPromises.push(addAsset("hero", appId, heroes[i].url));
                        }

                        // Download logos
                        if (heroes[i]) {
                            downloadPromises.push(addAsset("logo", appId, logos[i].url));
                        }
                    });

                    Promise.all(downloadPromises).then(() => {
                        alert("done downloading images");
                        PubSub.publish("toast", {
                            logoNode: "Download",
                            title: "Downloads Complete",
                            contents: (<p>All Images Downloaded!</p>)
                        });
                    });
                });
            }).catch((err) => {
                log.error("Cannot import while Steam is running");

                if (err.type === "OpenError") {
                    PubSub.publish("toast", {
                        logoNode: "Error",
                        title: "Error Importing",
                        contents: (
                            <p>
                                Cannot import while Steam is running.<br />
                                Close Steam and try again.
                            </p>
                        )
                    });
                }
            });
        });
    };

    const addGame = (game, platform):void => {
        return addGames([game], platform);
    };

    if (!isLoaded) {
        return (<Spinner text={loadingText} />);
    }

    console.log("About to render. steamIsRunning: ", steamIsRunning);

    return (
        <>
            <div
                id="import-container"
                style={{
                    height: "100%",
                    overflow: "auto",
                    padding: 15,
                    paddingLeft: 10,
                    paddingTop: 45
                }}
            >
                {steamIsRunning && (
                    <div
                        style={{
                            width: "100%",
                            backgroundColor: "#c06572",
                            padding: "10px",
                            marginBottom: "10px"
                        }}
                    >
                        <Icon
                            style={{
                                marginBottom: "2px",
                                marginRight: "5px"
                            }}
                        >
                            IncidentTriangle
                        </Icon>
                        SteamGridDB Manager can not import games while Steam is running. Please close Steam.
                    </div>
                )}

                {
                    installedPlatforms.map((platform) => {
                        if (!platform.error && platform.games.length) {
                            return (
                                <div key={platform.id}>
                                    <h5 style={{float: "left", ...theme.typographyStyles.subTitle}}>
                                        {platform.name}
                                    </h5>

                                    <ImportAllButton
                                        games={platform.games}
                                        platform={platform}
                                        grids={platform.grids}
                                        onButtonClick={addGames}
                                        steamIsRunning={steamIsRunning}
                                    />

                                    <ImportList
                                        games={platform.games}
                                        platform={platform}
                                        grids={platform.grids}
                                        onImportClick={addGame}
                                        steamIsRunning={steamIsRunning}
                                    />
                                </div>
                            );
                        }

                        return <></>;
                    })
                }
            </div>
        </>
    );
};

export default Import;
