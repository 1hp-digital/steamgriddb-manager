import React, {ReactElement, useEffect, useState} from "react";
import {Link, useParams} from "react-router-dom";
import Image from "react-uwp/Image";
import Button from "react-uwp/Button";
import PubSub from "pubsub-js";
import TopBlur from "./TopBlur";
import heroPlaceholder from "../images/hero_none.png";
import capsuleVerticalPlaceholder from "../images/capsule_vertical_none.png";
import capsulePlaceholder from "../images/capsule_none.png";
import logoPlaceholder from "../images/logo_none.png";
import {getTheme} from "react-uwp/Theme";
import Spinner from "./Spinner";
import getGameImages from "../utils/getGameImages";
import {Game, GameImages} from "../types";
import getGame from "../utils/getGame";

const Game = ():ReactElement => {
    const {appid} = useParams();

    const [game, setGame] = useState<Game>();
    const [images, setImages] = useState<GameImages>();
    const [isLoaded, setIsLoaded] = useState(false);

    const theme = getTheme();

    useEffect(() => {
        PubSub.publish("showBack", true);

        const fetchImages = async ():Promise<void> => {
            const game = await getGame(parseInt(appid));
            const images: GameImages = await getGameImages(game);

            setGame(game);
            setImages(images);
            setIsLoaded(true);
        };

        void fetchImages();
    }, []);

    // @todo fix this once game ids are normalized
    // const toSearch = (assetType):void => {
    //     setRedirect(<Redirect to={{pathname: "/search", state: {...location.state, assetType}}} />);
    // };

    const addNoCache = (imageURI):string|boolean => {
        if (!imageURI) {
            return false;
        }

        return `${imageURI}?${(new Date().getTime())}`;
    };


    const titleStyle = {
        padding: "20px 0px 10px 0",
        width: "100%",
    };
    const buttonStyle = {
        padding: 0,
    };

    if (!isLoaded) {
        return <Spinner />;
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
                <h1 style={theme.typographyStyles.header}>{game.name}</h1>
                <h5 style={titleStyle}>Hero</h5>
                <Link to={`/search/${game.appid}/hero`}>
                    <Image
                        style={{
                            width: "100%",
                            height: "auto",
                        }}
                        src={addNoCache(images.hero) || heroPlaceholder}
                    />
                </Link>

                <div style={{display: "flex"}}>
                    <div style={{flex: 1}}>
                        <h5 style={titleStyle}>Vertical Capsule</h5>
                        <Link to={`/search/${game.appid}/verticalGrid`}>
                            <Image
                                style={{
                                    maxWidth: "100%",
                                    height: "auto",
                                }}
                                src={addNoCache(images.poster) || capsuleVerticalPlaceholder}
                            />
                        </Link>
                    </div>
                    <div
                        style={{
                            marginLeft: 10,
                            flex: 1,
                        }}
                    >
                        <h5 style={titleStyle}>Horizontal Capsule</h5>
                        <Link to={`/search/${game.appid}/horizontalGrid`}>
                            <Image
                                style={{
                                    maxWidth: "100%",
                                    height: "auto",
                                }}
                                src={addNoCache(images.grid) || capsulePlaceholder}
                            />
                        </Link>
                    </div>
                </div>
                <div>
                    <h5 style={titleStyle}>Logo</h5>
                    <Link to={`/search/${game.appid}/logo`}>
                        <Image
                            style={{
                                maxWidth: "100%",
                                height: "auto",
                            }}
                            src={addNoCache(images.logo) || logoPlaceholder}
                        />
                    </Link>
                </div>
            </div>
        </>
    );
};

export default Game;
