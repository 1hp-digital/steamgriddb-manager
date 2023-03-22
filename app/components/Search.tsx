import React, {ReactElement, useEffect, useState} from "react";
import {Navigate, useParams} from "react-router-dom";
import Image from "react-uwp/Image";
import Button from "react-uwp/Button";
import PubSub from "pubsub-js";
import TopBlur from "./TopBlur";
import Spinner from "./Spinner";
import {getTheme} from "react-uwp/Theme";
import addAsset from "../utils/addAsset";
import getGame from "../utils/getGame";
import {Game} from "../types";
import {CheckBox, DropDownMenu} from "react-uwp";

import steamgriddb, {SGDBImageOptions} from "steamgriddb";
import Thumbnail from "./Thumbnail";

const ANY_STYLE = "Any Style";

const Search = ():ReactElement => {
    const {appid, assetType} = useParams();
    const SGDB = new steamgriddb({key: "b971a6f5f280490ab62c0ee7d0fd1d16"});

    const [game, setGame] = useState<Game>();
    const [items, setItems] = useState([]);
    const [useStyle, setUseStyle] = useState(ANY_STYLE);
    const [useStatic, setUseStatic] = useState(true);
    const [useAnimated, setUseAnimated] = useState(true);
    const [useHumor, setUseHumor] = useState(true);
    const [useAdultContent, setUseAdultContent] = useState(false);
    const [useEpilepsy, setUseEpilepsy] = useState(true);
    const [useUntagged, setUseUntagged] = useState(true);
    const [redirect, setRedirect] = useState<ReactElement | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const theme = getTheme();

    const allStyles = [ANY_STYLE];

    switch (assetType) {
        case "horizontalGrid":
        case "verticalGrid":
            allStyles.push(...["Alternate", "Blurred", "Material", "White Logo", "No Logo"]);
            break;
        case "hero":
            allStyles.push(...["Alternate", "Blurred", "Material"]);
            break;
        case "logo":
            allStyles.push(...["Official", "White", "Black", "Custom"]);
            break;
    }

    useEffect(() => {
        PubSub.publish("showBack", true);

        setIsLoading(true);

        const fetchGame = async ():Promise<void> => {
            const game = await getGame(parseInt(appid));
            setGame(game);
        };

        void fetchGame();
    }, []);

    useEffect(() => {
        if (!useHumor && !useAdultContent && !useEpilepsy && !useUntagged) {
            setUseUntagged(true);
            return;
        }

        if (!useStatic && !useAnimated) {
            setUseStatic(true);
            return;
        }

        setHasMore(true);
        setPage(0);

        if (page === 0) {
            void fetchImages();
        }
    }, [useStyle, useStatic, useAnimated, useHumor, useAdultContent, useEpilepsy, useUntagged]);

    useEffect(() => {
        void queryApi(0);
    }, [game, page]);

    const fetchImages = async (): Promise<void> => {
        if (!game || !hasMore) {
            return;
        }

        await queryApi(page);
    };

    const onScroll = (event): void => {
        if (event.target.scrollHeight - event.target.scrollTop === event.target.clientHeight) {
            console.log("bottom");
            setPage(page + 1);
        }
    };

    const onClick = (item, itemIndex):void => {
        const clonedItems = [...items];
        clonedItems[itemIndex].downloading = true;

        setItems(clonedItems);

        addAsset(assetType, game.appid, item.url).then(() => {
            clonedItems[itemIndex].downloading = false;
            setItems(clonedItems);
            setRedirect(<Navigate to={{pathname: `/game/${game.appid}`}} />);
        });
    };

    const queryApi = async (page = 0): Promise<void> => {
        let response;

        let id = game?.platform ? parseInt(game.gameId) : game.appid;
        let type = game.platform ?? "steam";

        if (game?.platform === "other") {
            type = "game";

            const gameResp = await SGDB.searchGame(game.name);
            id = gameResp[0].id;
        }

        const types = [];
        useStatic && types.push("static");
        useAnimated && types.push("animated");

        const styles = (useStyle === ANY_STYLE)
            ? allStyles.splice(1)
                .map((style) => style.toLowerCase().replace(/ /g, "_"))
            : [useStyle.toLowerCase().replace(/ /g, "_")];

        const selectedTags = [];
        if (!useUntagged) {
            useHumor && selectedTags.push("humor");
            useAdultContent && selectedTags.push("nsfw");
            useEpilepsy && selectedTags.push("epilepsy");
        }
        const oneoftag = selectedTags.join(",");

        const options:SGDBImageOptions = {
            type,
            id,
            types,
            styles,
            nsfw: useAdultContent ? "any" : "false",
            humor: useHumor ? "any" : "false",
            epilepsy: useEpilepsy ? "any" : "false",
            oneoftag,
            page
        };

        switch (assetType) {
            case "horizontalGrid":
                response = await SGDB.getGrids({dimensions: ["460x215", "920x430"], ...options});
                break;

            case "verticalGrid":
                response = await SGDB.getGrids({dimensions: ["600x900"], ...options});
                break;

            case "hero":
                response = await SGDB.getHeroes(options);
                break;

            case "logo":
                response = await SGDB.getLogos(options);
                break;

            default:
                return;
        }

        console.log("SGDB RESPONSE", response);

        if (!response.length) {
            setHasMore(false);
        }

        setIsLoading(false);


        if (page == 0) {
            setItems(response);
        } else {
            setItems([...items, ...response]);
        }
    };

    if (isLoading) {
        return <Spinner />;
    }

    if (redirect) {
        return redirect;
    }

    console.log("items", items);

    return (
        <div style={{
            "overflow": "scroll",
            "height": "100%"
        }}>
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
                <DropDownMenu
                    defaultValue={ANY_STYLE}
                    values={allStyles}
                    onChangeValue={setUseStyle}
                    style={{width:"120px"}}
                />
                <div className="searchOptions">
                    <div>
                        <span>Types</span>
                        <label>
                            <CheckBox
                                defaultChecked={useStatic}
                                onCheck={setUseStatic}
                            />
                            <span>Static</span>
                        </label>
                        <label>
                            <CheckBox
                                defaultChecked={useAnimated}
                                onCheck={setUseAnimated}
                            />
                            <span>Animated</span>
                        </label>
                    </div>
                    <div>
                        <span>Tags</span>
                        <label>
                            <CheckBox
                                defaultChecked={useHumor}
                                onCheck={setUseHumor}
                            />
                            <span>Humor</span>
                        </label>
                        <label>
                            <CheckBox
                                defaultChecked={useAdultContent}
                                onCheck={setUseAdultContent}
                            />
                            <span>Adult Content</span>
                        </label>
                        <label>
                            <CheckBox
                                defaultChecked={useEpilepsy}
                                onCheck={setUseEpilepsy}
                            />
                            <span>Epilepsy</span>
                        </label>
                        <label>
                            <CheckBox
                                defaultChecked={useUntagged}
                                onCheck={setUseUntagged}
                            />
                            <span>Untagged</span>
                        </label>
                    </div>
                </div>
            </div>
            <div
                id="search-container"
                style={{
                    height: "100%",
                    overflow: "auto",
                    padding: 15,
                    paddingLeft: 10,
                    paddingTop: 84
                }}
                onScroll={onScroll}
            >
                {items.map((item, i) => (
                    <Button
                        key={item.id}
                        style={{padding: 0, margin: 5}}
                        onClick={():void => onClick(item, i)}
                    >
                        <Thumbnail item={item} type={assetType} scale={1} isLoading={item.downloading} />
                        <p style={{...theme.typographyStyles.captionAlt, padding: 5}}>
                            <Image style={{height: 15, marginRight: 5}} src={item.author.avatar} />
                            {item.author.name}
                        </p>
                    </Button>
                ))}

                {items.length === 0 && (
                    <div style={{textAlign: "center", marginTop: 50}}>
                        No assets found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
