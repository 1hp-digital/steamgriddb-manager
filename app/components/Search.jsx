import React, {useEffect, useState} from "react";
import PropTypes from "prop-types";
import {Redirect} from "react-router-dom";
import Image from "react-uwp/Image";
import Button from "react-uwp/Button";
import PubSub from "pubsub-js";
import TopBlur from "./TopBlur";
import Spinner from "./Spinner";
import Steam from "../utils/Steam";
import {getTheme} from "react-uwp/Theme";
import addAsset from "../utils/steam/addAsset";

const SteamGridDB = window.require("steamgriddb");

const Search = (props) => {
    const {location} = props;
    console.log(SteamGridDB);

    const SGDB = new SteamGridDB("b971a6f5f280490ab62c0ee7d0fd1d16");
    const game = location.state;

    const [items, setItems] = useState([]);
    const [redirect, setRedirect] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const theme = getTheme();

    useEffect(() => {
        PubSub.publish("showBack", true);

        let type = "steam";
        if (game.platform) {
            type = game.platform;
        }

        let id;
        if (game.platform) {
            id = game.gameId;
        } else {
            id = game.appid;
        }

        if (game.platform === "other") {
            type = "game";
            SGDB.searchGame(game.name)
                .then((gameResp) => {
                    id = gameResp[0].id;
                    queryApi(type, id);
                });
        } else {
            queryApi(type, id);
        }
    }, []);

    const onClick = (item, itemIndex) => {
        const clonedItems = [...items];
        clonedItems[itemIndex].downloading = true;

        setItems(clonedItems);

        addAsset(location.state.assetType, game.appid, item.url).then(() => {
            clonedItems[itemIndex].downloading = false;
            setItems(clonedItems);
            setRedirect(<Redirect to={{pathname: "/game", state: location.state}} />);
        });
    };

    const queryApi = (type, id) => {
        switch (location.state.assetType) {
            case "horizontalGrid":
                SGDB.getGrids({type, id}).then((res) => {
                    setIsLoaded(true);
                    setItems(res);
                });

                break;
            case "verticalGrid":
                SGDB.getGrids({type, id, dimensions: ["600x900"]}).then((res) => {
                    setIsLoaded(true);
                    setItems(res);
                });

                break;
            case "hero":
                SGDB.getHeroes({type, id}).then((res) => {
                    setIsLoaded(true);
                    setItems(res);
                });

                break;
            case "logo":
                SGDB.getLogos({type, id}).then((res) => {
                    setIsLoaded(true);
                    setItems(res);
                });

                break;
            default:
                break;
        }
    };

    if (!isLoaded) {
        return <Spinner />;
    }

    if (redirect) {
        return redirect;
    }

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
                        onClick={() => onClick(item, i)}
                    >
                        {item.downloading ? (
                            <div style={{position: "relative"}}>
                                <Spinner size={70} style={{position: "absolute", background: "rgba(0,0,0,.5)"}} />
                                <Image
                                    style={{
                                        width: "100%",
                                        height: "auto",
                                    }}
                                    src={item.thumb}
                                />
                            </div>
                        ) : (
                            <Image
                                style={{
                                    width: "100%",
                                    height: "auto",
                                }}
                                src={item.thumb}
                            />
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

Search.propTypes = {
    location: PropTypes.object.isRequired,
};

Search.contextTypes = {theme: PropTypes.object};

export default Search;
