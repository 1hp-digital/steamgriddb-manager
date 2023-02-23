import React from "react";
import ListView from "react-uwp/ListView";
import PropTypes from "prop-types";
import ImportListItem from "./ImportListItem";

const ImportList = (props) => {
    const {
        onImportClick,
        games,
        grids,
        platform,
        steamIsRunning
    } = props;

    const listStyle = {
        background: "none",
        border: 0,
        width: "100%",
        marginBottom: 10,
        clear: "both",
    };

    const importList = games.map((game, i) => {
        let {progress} = game;
        let thumb;

        if (game.progress === undefined) {
            progress = 0;
        }

        if (grids[i]) {
            thumb = grids[i].thumb;
        }

        return {
            itemNode: (
                <ImportListItem
                    key={game.id}
                    progress={progress}
                    platform={platform}
                    thumb={thumb}
                    game={game}
                    onImportClick={onImportClick}
                    steamIsRunning={steamIsRunning}
                />
            ),
        };
    });

    return (
        <>
            <ListView style={listStyle} listSource={importList} />
        </>
    );
};

ImportList.propTypes = {
    games: PropTypes.array.isRequired,
    grids: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.bool,
    ]).isRequired,
    platform: PropTypes.object.isRequired,
    onImportClick: PropTypes.func,
    steamIsRunning: PropTypes.bool,
};

ImportList.defaultProps = {
    onImportClick: () => {},
    steamIsRunning: false,
};
export default ImportList;
