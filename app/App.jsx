import React, { useState } from "react";
import { TitleBar } from "react-desktop/windows";
import { Theme as UWPThemeProvider, getTheme } from "react-uwp/Theme";
import NavigationView from "react-uwp/NavigationView";
import SplitViewCommand from "react-uwp/SplitViewCommand";
import { IconButton } from "react-uwp";
import PubSub from "pubsub-js";
import {
    HashRouter as Router,
    Redirect,
    Link,
    Route,
} from "react-router-dom";
import ToastHandler from "./components/ToastHandler";

import UWPNoise from "./images/uwp-noise.png";
import "./styles/App.css";
import GamesList from "./components/GamesList";
import Game from "./components/Game";
import Import from "./components/Import";
import Search from "./components/Search";

import Steam from "./utils/Steam";

// Using window.require so babel doesn't change the node require
const electron = window.require("electron");
const { remote } = electron;

// Log renderer errors
const log = window.require("electron-log");
log.catchErrors({ showDialog: true });

window.Steam = Steam;

const App = () => {
    const [isMaximized, setIsMaximized] = useState();
    const [showBack, setShowBack] = useState();
    const [redirect, setRedirect] = useState();

    const window = remote.getCurrentWindow();

    window.on("maximize", () => {
        setIsMaximized(true);
    });

    window.on("unmaximize", () => {
        setIsMaximized(false);
    });

    PubSub.subscribe("showBack", (message, args) => {
        setShowBack(args);
    });

    const toggleMaximize = () => {
        const window = remote.getCurrentWindow();

        setIsMaximized(!isMaximized);

        if (!isMaximized) {
            window.maximize();
        } else {
            window.unmaximize();
        }
    };

    const handleNavRedirect = (path) => {
        setRedirect(path);
    };

    const minimize = () => {
        remote.getCurrentWindow().minimize();
    };

    const close = () => {
        remote.getCurrentWindow().close();
    };

    const accentColor = remote.systemPreferences.getAccentColor();
    const navWidth = 48;

    const navigationTopNodes = [
        <SplitViewCommand key="0" label="Library" icon="Library" onClick={() => handleNavRedirect("/")} />,
        <SplitViewCommand key="1" label="Import Games" icon="ImportAll" onClick={() => handleNavRedirect("/import")} />,
    ];

    let backButton = <></>;
    let titleWidth = "100%";

    if (showBack) {
        backButton = (
            <Link
                to="/"
                onClick={() => {
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
                        zIndex: 2,
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
        <UWPThemeProvider
            theme={getTheme({
                themeName: "dark",
                accent: `#${accentColor}`,
                useFluentDesign: true,
            })}
        >
            <Router>
                <div style={{ backgroundColor: "#1a1a1a" }}>
                    {backButton}
                    <TitleBar
                        title="SteamGridDB Manager"
                        style={{
                            position: "relative",
                            top: 0,
                            width: titleWidth,
                            height: 30,
                            zIndex: 2,
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
                            width: "100%",
                        }}
                        paneStyle={{
                            marginTop: 30,
                            backgroundColor: "rgba(0,0,0,.2)",
                            backgroundImage: `url(${UWPNoise})`,
                            backdropFilter: "blur(20px)",
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
                                zIndex: 0,
                            }}
                        >
                            {redirect && <Redirect to={redirect} />}

                            <Route exact path="/" component={GamesList} />
                            <Route exact path="/import" component={Import} />
                            <Route exact path="/game" component={Game} />
                            <Route exact path="/search" component={Search} />

                        </div>
                    </NavigationView>
                </div>
            </Router>

            <ToastHandler />
        </UWPThemeProvider>
    );

};

export default App;
