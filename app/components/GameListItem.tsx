import * as React from "react";
import ListView from "react-uwp/ListView";
import {getTheme} from "react-uwp/Theme";
import {ReactElement} from "react";

interface GameListItemProps {
    platform: string;
    listSource: ReactElement[];
    platformName: string;
    onItemClick: (platform: string, index: number) => void;
}

const GameListItem = (props:GameListItemProps): ReactElement => {
    const {
        platform,
        platformName,
        listSource,
        onItemClick = (): void => {}
    } = props;

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

export default GameListItem;
