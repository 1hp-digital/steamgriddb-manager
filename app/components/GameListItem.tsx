// @ts-nocheck
import {Game} from "../types";
import React, {ReactElement, useEffect, useState} from "react";
import getGameImages from "../utils/getGameImages";


interface GameListItemProps {
    game: Game,
    onClick: () => void
}

const GameListItem = (props:GameListItemProps):ReactElement => {
    const {game, onClick} = props;
    const [image, setImage] = useState(false);

    console.log("GameListItem", props);

    useEffect(() => {
        const getImages = async (): void => {
            const images = await getGameImages(game);
            setImage(images.poster);
        };

        getImages();
    }, []);


    return (
        <div onClick={onClick} className="grow" style={{
            padding: "10px",
            filter: "drop-shadow(5px 5px 15px #042430)",
        }}>
            <img src={image} width={150} />
        </div>
    );
};

export default GameListItem;
