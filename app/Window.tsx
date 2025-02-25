import * as React from "react";
import {TitleBar} from "react-desktop/windows";
import {getTheme} from "react-uwp/Theme";
import NavigationView from "react-uwp/NavigationView";
import SplitViewCommand from "react-uwp/SplitViewCommand";
import {IconButton} from "react-uwp";
import PubSub from "pubsub-js";
import {
    Routes,
    Link,
    Route
} from "react-router-dom";
import UWPNoise from "./images/uwp-noise.png";
import "./styles/App.css";
import GamesList from "./components/GamesList";
import Game from "./components/Game";
import Search from "./components/Search";
import {ReactElement, useState} from "react";
import Import from "./components/Import";
import {useNavigate} from "react-router-dom";

const electron = window.require("electron");
const {remote} = electron;

const currentWindow = remote.getCurrentWindow();
const navWidth = 48;

const Window = ():ReactElement => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [showBack, setShowBack] = useState(false);
    const navigate = useNavigate();

    currentWindow.on("maximize", () => setIsMaximized(true));
    currentWindow.on("unmxaximize", () => setIsMaximized(false));

    PubSub.subscribe("showBack", (message, args) => setShowBack(args));

    const toggleMaximize = ():void => {
        setIsMaximized(!isMaximized);
        isMaximized ? currentWindow.unmaximize() : currentWindow.maximize();
    };

    const minimize = ():void => remote.getCurrentWindow().minimize();
    const close = ():void => remote.getCurrentWindow().close();

    const navigationTopNodes = [
        <SplitViewCommand key="0" label="Library" icon="Library" onClick={():void => navigate("/")} />,
        <SplitViewCommand key="1" label="Import Games" icon="ImportAll" onClick={():void => navigate("/import")} />
    ];

    let backButton = <></>;
    let titleWidth = "100%";

    if (showBack) {
        backButton = (
            <Link
                to="/"
                onClick={():void => {
                    setShowBack(false);
                }}
            >
                <IconButton
                    style={{
                        display: "block",
                        position: "relative",
                        float: "left",
                        width: navWidth,
                        height: 30,
                        lineHeight: "31px",
                        backgroundColor: "#141414",
                        zIndex: 2
                    }}
                    size={22}
                >
                    Back
                </IconButton>
            </Link>
        );
        titleWidth = `calc(100% - ${navWidth}px)`;
    }

    return (
        <div style={{backgroundColor: "#1a1a1a"}}>
            {backButton}
            <TitleBar
                title="SteamGridDB Manager"
                style={{
                    position: "relative",
                    top: 0,
                    width: titleWidth,
                    height: 30,
                    zIndex: 2
                }}
                controls
                isMaximized={isMaximized}
                onCloseClick={close}
                onMinimizeClick={minimize}
                onMaximizeClick={toggleMaximize}
                onRestoreDownClick={toggleMaximize}
                background="transparent"
                color="#fff"
                theme="dark"
            />
            <NavigationView
                style={{
                    position: "absolute",
                    top: 0,
                    height: "calc(100vh - 30px)",
                    width: "100%"
                }}
                paneStyle={{
                    marginTop: 30,
                    backgroundColor: "rgba(0,0,0,.2)",
                    backgroundImage: `url(${UWPNoise})`,
                    backdropFilter: "blur(20px)"
                }}
                background="transparent"
                displayMode="overlay"
                autoResize={false}
                initWidth={navWidth}
                navigationTopNodes={navigationTopNodes}
                focusNavigationNodeIndex={0}
            >
                <div
                    style={{
                        ...getTheme().typographyStyles.base,
                        marginLeft: navWidth,
                        height: "100%",
                        position: "relative",
                        overflow: "auto",
                        zIndex: 0
                    }}
                >
                    <Routes>
                        <Route path="/" element={<GamesList />}/>
                        <Route path="/game/:appid" element={<Game />} />
                        <Route path="/search/:appid/:assetType" element={<Search />} />
                        <Route path="/import" element={<Import />} />
                    </Routes>
                </div>
            </NavigationView>
        </div>
    );
};

export default Window;
