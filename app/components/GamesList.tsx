import React, {ReactElement, useEffect, useState} from "react";
import {Redirect} from "react-router-dom";
import AutoSuggestBox from "react-uwp/AutoSuggestBox";
import AppBarButton from "react-uwp/AppBarButton";
import AppBarSeparator from "react-uwp/AppBarSeparator";
import Separator from "react-uwp/Separator";
import Fuse from "fuse.js";
import PubSub from "pubsub-js";
import {debounce} from "lodash";
import {forceCheck} from "react-lazyload";
import Spinner from "./Spinner";
import TopBlur from "./TopBlur";
import GameListItem from "./GameListItem";
import {getTheme} from "react-uwp/Theme";
import getSteamPath from "../utils/getSteamPath";
import getSteamGames from "../utils/getSteamGames";
import getNonSteamGames from "../utils/getNonSteamGames";
import {GamesList} from "../types";

const log = window.require("electron-log");

const GamesList = ():ReactElement => {
    const searchInput = debounce((searchTerm) => {
        filterGames(searchTerm);
    }, 300);

    const platformNames = {
        steam: "Steam",
        other: "Other Games",
    };

    const [fetchedGames, setFetchedGames] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [redirect, setRedirect] = useState<ReactElement|null>(null);
    const [hasSteam, setHasSteam] = useState(true);
    const [items, setItems] = useState<GamesList>({});

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

    const fetchGames = async ():Promise<void> => {
        const steamGames = await getSteamGames();
        const nonSteamGames = await getNonSteamGames();
        const items = {steam: steamGames, ...nonSteamGames};

        // Sort games alphabetically
        Object.keys(items)
            .forEach((platform) => {
                items[platform] = items[platform].sort((a, b) => {
                    if (a.name > b.name) {
                        return 1;
                    }

                    return ((b.name > a.name) ? -1 : 0);
                });
            });

        setFetchedGames(items);
        setIsLoaded(true);
        setItems(items);
    };

    const toGame = (platform, index):void => {
        const data = items[platform][index];
        setRedirect(<Redirect to={{pathname: "/game", state: data}} />);
    };

    const refreshGames = ():void => {
        setIsLoaded(false);
        fetchGames();
    };

    const filterGames = (searchTerm):void => {
        const items = {...fetchedGames};

        if (searchTerm.trim() === "") {
            setItems(items);
            return;
        }

        Object.keys(items).forEach((platform) => {
            const fuse = new Fuse(items[platform], {
                shouldSort: true,
                threshold: 0.6,
                location: 0,
                distance: 100,
                maxPatternLength: 32,
                minMatchCharLength: 1,
                keys: [
                    "name",
                ],
            });
            items[platform] = fuse.search(searchTerm);
        });

        setItems(items);
        forceCheck(); // Recheck lazyload
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

    if (redirect) {
        return redirect;
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
                    zIndex: 2,
                }}
            >
                <AutoSuggestBox style={{marginLeft: "auto", marginRight: 24}} placeholder="Search" onChangeValue={searchInput} />
                <AppBarSeparator style={{height: 24}} />
                <AppBarButton
                    icon="Refresh"
                    label="Refresh"
                    onClick={refreshGames}
                />
            </div>
            <div id="grids-container" style={{height: "100%", overflow: "auto", paddingTop: 64}}>
                {Object.keys(items).map((platform, i) => (
                    <GameListItem
                        key={platform}
                        platform={platform}
                        platformName={platformNames[platform]}
                        listSource={[
                            ...items[platform].map((item) => <p key={item.appid} id={`game-${item.appid}`}>{item.name}</p>),
                            <Separator key={i} disabled />,
                        ]}
                        onItemClick={toGame}
                    />
                ))}
            </div>
        </div>
    );
};

export default GamesList;
