import React, {CSSProperties, ReactElement} from "react";
import {ProgressCircle} from "react-desktop/windows";
import {getTheme} from "react-uwp/Theme";

interface SpinnerProps {
    text?: string;
    size?: number;
    style?: CSSProperties;
}

const Spinner = (props:SpinnerProps):ReactElement => {
    const {
        text = "",
        size = 100,
        style = {}
    } = props;
    const theme = getTheme();

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                ...style,
            }}
        >
            <ProgressCircle size={size} color={theme.accent} />
            <p style={{marginTop: 15}}>{text}</p>
        </div>
    );
};

export default Spinner;
