import React, {ReactElement, useEffect, useState} from "react";
import AutoSuggestBox from "react-uwp/AutoSuggestBox";
import AppBarButton from "react-uwp/AppBarButton";
import AppBarSeparator from "react-uwp/AppBarSeparator";
import Fuse from "fuse.js";
import PubSub from "pubsub-js";
import {debounce} from "lodash";
import {forceCheck} from "react-lazyload";
import Spinner from "./Spinner";
import TopBlur from "./TopBlur";
import {getTheme} from "react-uwp/Theme";
import getSteamPath from "../utils/getSteamPath";
import getSteamGames from "../utils/getSteamGames";
import getNonSteamGames from "../utils/getNonSteamGames";
import {Game} from "../types";
import GameListItem from "./GameListItem";
import {Dropdown, Option} from "@fluentui/react-components";

const log = window.require("electron-log");

const ALL_GAMES = "ALL GAMES";

const GamesList = ():ReactElement => {
    const searchInput = debounce((searchTerm) => {
        searchGames(searchTerm);
    }, 300);

    const [fetchedGames, setFetchedGames] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasSteam, setHasSteam] = useState(true);
    const [displayedGames, setDisplayedGames] = useState<Game[]>([]);
    const [tags, setTags] = useState<string[]>([]);

    const theme = getTheme();

    useEffect(() => {
        PubSub.publish("showBack", false);

        const fetchData = async ():Promise<void> => {
            const steamPath = await getSteamPath();

            if (!steamPath) {
                log.warn("Steam is not installed");
                setHasSteam(false);
            }

            await fetchGames();
        };

        void fetchData();
    }, []);

    const sortGames = (games:Game[]):Game[] => {
        return games.sort((a, b) => {
            if (a.name > b.name) {
                return 1;
            }

            return ((b.name > a.name) ? -1 : 0);
        });
    };

    const fetchGames = async ():Promise<void> => {
        const steamGames = await getSteamGames();
        const nonSteamGames = await getNonSteamGames();
        const allGames = [...steamGames, ...nonSteamGames];

        const sortedGames = sortGames(allGames);

        const tags = [...new Set(sortedGames.flatMap(({tags}) => tags))]
            .map((tag) => tag?.toUpperCase() ?? ALL_GAMES);

        setFetchedGames(sortedGames);
        setTags(tags);
        setIsLoaded(true);
        setDisplayedGames(sortedGames);
    };

    const refreshGames = ():void => {
        setIsLoaded(false);
        void fetchGames();
    };

    const searchGames = (searchTerm):void => {
        const items = [...fetchedGames];

        if (searchTerm.trim() === "") {
            setDisplayedGames(items);
            return;
        }

        const fuse = new Fuse(items, {
            keys: ["name"]
        });
        const result = fuse.search(searchTerm);
        const searchedGames = result.map((item) => item.item);

        setDisplayedGames(searchedGames);
        forceCheck(); // Recheck lazyload
    };

    const filterGames = (event, data):void => {
        const tagToFilter = data.optionValue;
        if (tagToFilter === ALL_GAMES) {
            setDisplayedGames(fetchedGames);
            return;
        }

        const filteredGames = fetchedGames.filter((item) => {
            return item.tags?.some((tag) => tagToFilter.toUpperCase() === tag.toUpperCase());
        });

        setDisplayedGames(filteredGames);
    };

    if (!hasSteam) {
        return (
            <h5 style={{...theme.typographyStyles.title, textAlign: "center"}}>
                Steam installation not found.
            </h5>
        );
    }

    if (!isLoaded) {
        return <Spinner />;
    }

    return (
        <div style={{height: "inherit", overflow: "hidden"}}>
            <TopBlur additionalHeight={48} />
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    position: "fixed",
                    top: 30,
                    width: "calc(100vw - 55px)",
                    height: 48,
                    zIndex: 2
                }}
            >
                <Dropdown
                    defaultSelectedOptions={[ALL_GAMES]}
                    defaultValue={ALL_GAMES}
                    appearance="underline"
                    onOptionSelect={filterGames}
                    // options={tags}
                    // onChangeValue={filterGames}
                >
                    {tags.map((option) => (
                        <Option key={option} disabled={option === "Ferret"}>
                            {option}
                        </Option>
                    ))}
                </Dropdown>
                <AutoSuggestBox style={{marginLeft: "auto", marginRight: 24}} placeholder="Search" onChangeValue={searchInput} />
                <AppBarSeparator style={{height: 24}} />
                <AppBarButton
                    icon="Refresh"
                    label="Refresh"
                    onClick={refreshGames}
                />
            </div>
            <div id="grids-container" style={{
                height: "100%",
                overflow: "auto",
                paddingTop: 84,
                display: "flex",
                flexWrap: "wrap"
            }}>
                {displayedGames.map((item) => {
                    return (
                        <GameListItem
                            key={item.appid}
                            game={item}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default GamesList;
