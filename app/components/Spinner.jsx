import React from "react";
import PropTypes from "prop-types";
import { ProgressCircle } from "react-desktop/windows";
import { getTheme } from "react-uwp/Theme";

const Spinner = (props) => {
    const { text, size, style } = props;
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
            <p style={{ marginTop: 15 }}>{text}</p>
        </div>
    );
};

Spinner.propTypes = {
    text: PropTypes.string,
    size: PropTypes.number,
    style: PropTypes.object,
};

Spinner.defaultProps = {
    text: "",
    size: 100,
    style: {},
};

Spinner.contextTypes = { theme: PropTypes.object };
export default Spinner;
