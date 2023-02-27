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

const SteamGridDB = window.require("steamgriddb");

const Search = ():ReactElement => {
    const {appid, assetType} = useParams();
    const SGDB = new SteamGridDB("b971a6f5f280490ab62c0ee7d0fd1d16");


    const [game, setGame] = useState<Game>();
    const [items, setItems] = useState([]);
    const [redirect, setRedirect] = useState<ReactElement|null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const theme = getTheme();

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

        void fetchImages();
    }, [game]);

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

        switch (assetType) {
            case "horizontalGrid":
                response = await SGDB.getGrids({
                    dimensions: ["460x215", "920x430"],
                    types: ["static", "animated"],
                    type,
                    id
                });
                break;

            case "verticalGrid":
                response = await SGDB.getGrids({
                    dimensions: ["600x900"],
                    types: ["static", "animated"],
                    type,
                    id
                });
                break;

            case "hero":
                response = await SGDB.getHeroes({type, id, types: ["static", "animated"]});
                break;

            case "logo":
                response = await SGDB.getLogos({type, id, types: ["static", "animated"]});
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
            <TopBlur />
            <div
                id="search-container"
                style={{
                    height: "100%",
                    overflow: "auto",
                    padding: 15,
                    paddingLeft: 10,
                    paddingTop: 45,
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
