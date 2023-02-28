import React, {ReactElement} from "react";
import UWPNoise from "../images/uwp-noise.png";

interface TopBlurProps {
    additionalHeight?: number;
}

const TopBlur = ({additionalHeight}:TopBlurProps):ReactElement => (
    <div
        style={{
            position: "fixed",
            top: 0,
            height: 30 + additionalHeight,
            width: "100%",
            backgroundColor: "rgba(0,0,0,.2)",
            backgroundImage: `url(/${UWPNoise})`,
            backdropFilter: "blur(20px)",
            zIndex: 2,
        }}
    />
);

export default TopBlur;
