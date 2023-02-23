import * as React from "react";
import * as PropTypes from "prop-types";
import ListView from "react-uwp/ListView";
import {getTheme} from "react-uwp/Theme";
import {ReactElement} from "react";

const GameListItem = (props): ReactElement => {
    const {platform, platformName, listSource, onItemClick} = props;

    const theme = getTheme();

    const handleClick = (index): void => {
        onItemClick(platform, index);
    };

    return (
        <div key={platform} style={{paddingLeft: 10}}>
            <div style={{
                ...theme.typographyStyles.subTitleAlt,
                display: "inline-block",
                position: "sticky",
                zIndex: 3,
                marginLeft: 10,
                top: -22,
            }}
            >
                {platformName}
            </div>
            <ListView
                style={{border: 0, width: "100%"}}
                background="transparent"
                onChooseItem={handleClick}
                listSource={listSource}
            />
        </div>
    );
};

GameListItem.propTypes = {
    platform: PropTypes.string.isRequired,
    listSource: PropTypes.arrayOf(PropTypes.node).isRequired,
    platformName: PropTypes.string.isRequired,
    onItemClick: PropTypes.func,
};

GameListItem.defaultProps = {
    onItemClick: (): void => {},
};

GameListItem.contextTypes = {theme: PropTypes.object};

export default GameListItem;
