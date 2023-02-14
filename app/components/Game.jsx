import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Redirect } from "react-router-dom";
import Image from "react-uwp/Image";
import Button from "react-uwp/Button";
import PubSub from "pubsub-js";
import TopBlur from "./TopBlur";
import Steam from "../utils/Steam";
import heroPlaceholder from "../images/hero_none.png";
import capsuleVerticalPlaceholder from "../images/capsule_vertical_none.png";
import capsulePlaceholder from "../images/capsule_none.png";
import logoPlaceholder from "../images/logo_none.png";
import { getTheme } from "react-uwp/Theme";

const Game = (props) => {
    const {location} = props;
    const game = location.state;

    const [grid, setGrid] = useState();
    const [poster, setPoster] = useState();
    const [hero, setHero] = useState();
    const [logo, setLogo] = useState();
    const [redirect, setRedirect] = useState();

    const theme = getTheme();

    useEffect(() => {
        PubSub.publish("showBack", true);

        const fetchData = async () => {
            const images = await Steam.getGameImages(game);

            setGrid(images.grid);
            setPoster(images.poster);
            setHero(images.hero);
            setLogo(images.logo);
        };

        fetchData();
    }, []);

    const toSearch = (assetType) => {
        setRedirect(<Redirect to={{ pathname: "/search", state: { ...location.state, assetType } }} />);
    };

    const addNoCache = (imageURI) => {
        if (!imageURI) {
            return false;
        }

        return `${imageURI}?${(new Date().getTime())}`;
    };

    if (redirect) {
        return redirect;
    }

    const titleStyle = {
        // ...theme.typographyStyles.subTitle,
        padding: "20px 0px 10px 0",
        width: "100%",
    };
    const buttonStyle = {
        padding: 0,
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
                <h1 style={theme.typographyStyles.header}>{game.name}</h1>
                <h5 style={titleStyle}>Hero</h5>
                <Button style={buttonStyle} onClick={() => toSearch("hero")}>
                    <Image
                        style={{
                            width: "100%",
                            height: "auto",
                        }}
                        src={addNoCache(hero) || heroPlaceholder}
                    />
                </Button>

                <div style={{ display: "flex" }}>
                    <div style={{ flex: 1 }}>
                        <h5 style={titleStyle}>Vertical Capsule</h5>
                        <Button style={buttonStyle} onClick={() => toSearch("verticalGrid")}>
                            <Image
                                style={{
                                    maxWidth: "100%",
                                    height: "auto",
                                }}
                                src={addNoCache(poster) || capsuleVerticalPlaceholder}
                            />
                        </Button>
                    </div>
                    <div
                        style={{
                            marginLeft: 10,
                            flex: 1,
                        }}
                    >
                        <h5 style={titleStyle}>Horizontal Capsule</h5>
                        <Button style={buttonStyle} onClick={() => toSearch("horizontalGrid")}>
                            <Image
                                style={{
                                    maxWidth: "100%",
                                    height: "auto",
                                }}
                                src={addNoCache(grid) || capsulePlaceholder}
                            />
                        </Button>
                    </div>
                </div>
                <div>
                    <h5 style={titleStyle}>Logo</h5>
                    <Button style={buttonStyle} onClick={() => toSearch("logo")}>
                        <Image
                            style={{
                                maxWidth: "100%",
                                height: "auto",
                            }}
                            src={addNoCache(logo) || logoPlaceholder}
                        />
                    </Button>
                </div>
            </div>
        </>
    );
};

Game.propTypes = {
    location: PropTypes.object.isRequired,
};

Game.contextTypes = { theme: PropTypes.object };

export default Game;
