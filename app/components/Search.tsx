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
import {DropDownMenu} from "react-uwp";

const SteamGridDB = window.require("steamgriddb");

const ANY_STYLE = "Any Style";

const Search = ():ReactElement => {
    const {appid, assetType} = useParams();
    const SGDB = new SteamGridDB("b971a6f5f280490ab62c0ee7d0fd1d16");

    const [game, setGame] = useState<Game>();
    const [items, setItems] = useState([]);
    const [style, setStyle] = useState(ANY_STYLE);
    const [useStatic, setUseStatic] = useState(true);
    const [useAnimated, setUseAnimated] = useState(true);
    const [useHumor, setUseHumor] = useState(true);
    const [useAdultContent, setUseAdultContent] = useState(false);
    const [useEpilepsy, setUseEpilepsy] = useState(true);
    const [useUntagged, setUseUntagged] = useState(true);
    const [redirect, setRedirect] = useState<ReactElement|null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const theme = getTheme();

    const styles = [ANY_STYLE, "Static", "Animated"];

    useEffect(() => {
        PubSub.publish("showBack", true);

        const fetchGame = async ():Promise<void> => {
            const game = await getGame(parseInt(appid));
            setGame(game);
        };

        void fetchGame();
    }, []);

    useEffect(() => {
        if (!game) {
            return;
        }

        void fetchImages();
    }, [game]);

    useEffect(() => {
        void fetchImages();
    }, [style]);

    const fetchImages = async (): Promise<void> => {
        let id = game?.platform ? game.gameId : game.appid;
        let type = game.platform ?? "steam";

        if (game?.platform === "other") {
            type = "game";

            const gameResp = await SGDB.searchGame(game.name);
            id = gameResp[0].id;
        }

        await queryApi(type, id);
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

    const queryApi = async (type, id): Promise<void> => {
        let response;

        const types = style === ANY_STYLE ? ["static", "animated"] : [style.toLowerCase()];

        switch (assetType) {
            case "horizontalGrid":
                response = await SGDB.getGrids({
                    dimensions: ["460x215", "920x430"],
                    types,
                    type,
                    id
                });
                break;

            case "verticalGrid":
                response = await SGDB.getGrids({
                    dimensions: ["600x900"],
                    types,
                    type,
                    id
                });
                break;

            case "hero":
                response = await SGDB.getHeroes({type, id, types});
                break;

            case "logo":
                response = await SGDB.getLogos({type, id, types});
                break;

            default:
                return;
        }

        setIsLoaded(true);
        setItems(response);
    };

    if (!isLoaded) {
        return <Spinner />;
    }

    if (redirect) {
        return redirect;
    }

    const getThumbnailElement = (src):JSX.Element => {
        if (src.endsWith(".webm")) {
            return (
                <video
                    src={src}
                    autoPlay
                    playsInline
                    loop
                    style={{width: "100%", height: "auto"}}
                />
            );
        } else {
            return (
                <Image
                    style={{
                        width: "100%",
                        height: "auto",
                    }}
                    src={src}
                />
            );
        }
    };

    return (
        <>
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
                <DropDownMenu
                    defaultValue={ANY_STYLE}
                    values={styles}
                    onChangeValue={setStyle}
                    style={{width:"120px"}}
                />
            </div>
            <div
                id="search-container"
                style={{
                    height: "100%",
                    overflow: "auto",
                    padding: 15,
                    paddingLeft: 10,
                    paddingTop: 84,
                }}
            >
                {items.map((item, i) => (
                    <Button
                        key={item.id}
                        style={{padding: 0, margin: 5}}
                        onClick={():void => onClick(item, i)}
                    >
                        {item.downloading ? (
                            <div style={{position: "relative"}}>
                                <Spinner size={70} style={{position: "absolute", background: "rgba(0,0,0,.5)"}} />
                                {getThumbnailElement(item.thumb)}
                            </div>
                        ) : (
                            <>{getThumbnailElement(item.thumb)}</>
                        )}
                        <p style={{...theme.typographyStyles.captionAlt, padding: 5}}>
                            <Image style={{height: 20, marginRight: 5}} src={item.author.avatar} />
                            {item.author.name}
                        </p>
                    </Button>
                ))}
            </div>
        </>
    );
};

export default Search;
