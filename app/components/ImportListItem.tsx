import React, {ReactElement} from "react";
import Image from "react-uwp/Image";
import Button from "react-uwp/Button";
import ProgressBar from "react-uwp/ProgressBar";
import PropTypes from "prop-types";

const ImportListItem = (props):ReactElement => {
    const {game, platform, onImportClick, progress, thumb, steamIsRunning} = props;

    const handleClick = ():void => {
        onImportClick(game, platform);
    };

    let progressBar = <></>;
    if (progress && progress !== 1) {
        progressBar = <ProgressBar style={{display: "block", width: "100%"}} defaultProgressValue={game.progress} />;
    }

    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                width: "inherit",
            }}
        >
            <Image
                style={{marginRight: 10}}
                height="30px"
                // width="64px"
                src={thumb}
            />
            {game.name}
            <Button
                style={{opacity: 0, marginLeft: "auto"}}
                onClick={handleClick}
                disabled={steamIsRunning}
            >
          Import
            </Button>
            {progressBar}
        </div>
    );
};

ImportListItem.propTypes = {
    platform: PropTypes.object.isRequired,
    game: PropTypes.object.isRequired,
    progress: PropTypes.number,
    thumb: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.bool,
    ]),
    onImportClick: PropTypes.func,
    steamIsRunning: PropTypes.bool,
};

ImportListItem.defaultProps = {
    progress: 0,
    thumb: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII=",
    onImportClick: ():void => {},
    steamIsRunning: false,
};

export default ImportListItem;
