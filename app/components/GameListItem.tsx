// @ts-nocheck
import {Game} from "../types";
import React, {ReactElement, useEffect, useState} from "react";
import getGameImages from "../utils/getGameImages";
import {Link} from "react-router-dom";


interface GameListItemProps {
    game: Game
}

const GameListItem = (props:GameListItemProps):ReactElement => {
    const {game} = props;
    const [image, setImage] = useState(false);

    useEffect(() => {
        const getImages = async (): Promise<void> => {
            const images = await getGameImages(game);
            setImage(images.poster);
        };

        getImages();
    }, []);

    return (

        <div className="grow" style={{
            padding: "10px",
            filter: "drop-shadow(5px 5px 15px #042430)",
        }}>
            <Link to={`/game/${game.appid}`}>
                {image &&
                    <img src={image} width={150}/>
                }

                {!image &&
                    <div style={{
                        width: 150,
                        height: 225,
                        border: "1px solid #042430",
                        textAlign: "center",
                        background: "radial-gradient(circle, rgba(100,108,118,1) 0%, rgba(4,36,48,1) 100%)"
                    }}>
                        <div style={{
                            padding: "10px",
                            marginTop: "20px",

                        }}>
                            {game.name}
                        </div>
                    </div>
                }
            </Link>
        </div>

    );
};

export default GameListItem;
