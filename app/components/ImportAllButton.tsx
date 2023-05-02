import React, {ReactElement} from "react";
import Button from "react-uwp/Button";
import PropTypes from "prop-types";

const ImportAllButton = (props):ReactElement => {
    const {onButtonClick, games, platform, steamIsRunning} = props;

    const handleClick = ():void => {
        onButtonClick(games, platform);
    };

    return (
        <Button
            style={{float: "right"}}
            onClick={handleClick}
            disabled={steamIsRunning}
        >
            Import All
        </Button>
    );
};

ImportAllButton.propTypes = {
    platform: PropTypes.object.isRequired,
    games: PropTypes.array.isRequired,
    onButtonClick: PropTypes.func,
    steamIsRunning: PropTypes.bool,
};

ImportAllButton.defaultProps = {
    onButtonClick: ():void => {},
    steamIsRunning: false,
};

export default ImportAllButton;
