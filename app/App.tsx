import * as React from "react";
import {Theme as UWPThemeProvider, getTheme} from "react-uwp/Theme";
import {HashRouter} from "react-router-dom";
import ToastHandler from "./components/ToastHandler";
import {ReactElement} from "react";
import Window from "./Window";
import {FluentProvider, teamsDarkTheme} from "@fluentui/react-components";

import "./styles/App.css";

// Using window.require so babel doesn't change the node require
const electron = window.require("electron");
const {remote} = electron;

// Log renderer errors
const log = window.require("electron-log");
log.catchErrors({showDialog: true});

const App = ():ReactElement => {
    const accentColor = remote.systemPreferences.getAccentColor();

    return (
        <FluentProvider theme={teamsDarkTheme}>
            <UWPThemeProvider
                theme={getTheme({
                    themeName: "dark",
                    accent: `#${accentColor}`,
                    useFluentDesign: true
                })}
            >
                <HashRouter>
                    <Window />
                </HashRouter>

                <ToastHandler />
            </UWPThemeProvider>
        </FluentProvider>
    );

};

export default App;
