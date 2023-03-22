import React, {MouseEvent, ReactElement, useState} from "react";
import {SteamGridDBImageData} from "../types";
import Image from "react-uwp/Image";
import Spinner from "./Spinner";

interface ThumbnailProps {
    item: SteamGridDBImageData;
    type: string;
    scale: number;
    isLoading: boolean;
}

const defaultWidths = {
    horizontalGrid: 400,
    verticalGrid: 200,
    hero: 400,
    logo: 400
};

const Thumbnail = (props:ThumbnailProps):ReactElement => {
    const {item, type, scale, isLoading} = props;

    const shouldBlur = item.nsfw || item.epilepsy;
    const isVideo = item.thumb.endsWith(".webm");

    const [isBlurred, setIsBlurred] = useState<boolean>(shouldBlur);
    const [isHovering, setIsHovering] = useState<boolean>(false);

    const blurStyle = {
        filter: isBlurred ? "blur(30px)" : "none",
        transition: "filter 0.5s ease-out"
    };



    const width = `${defaultWidths[type] * scale}px`;

    console.log("type is ", type, "width is ", width);

    const handleClick = (event:MouseEvent):void => {
        if (isBlurred) {
            event.stopPropagation();
            setIsBlurred(false);
        }
    };

    if (!item.thumb) {
        return <></>;
    }

    const contentWarningText = item.nsfw ? "ADULT CONTENT" : "EPILEPSY WARNING";

    return (
        <div style={{position: "relative"}}>
            <div style={{...blurStyle}}>
                {isVideo ? (
                    <div style={{width}}>
                        <video
                            src={item.thumb}
                            autoPlay={isBlurred ? false : true}
                            playsInline
                            loop
                            style={{width: "100%", height: "auto"}}
                        />
                    </div>
                ) : (
                    <Image
                        style={{width, height: "auto"}}
                        src={item.thumb}
                    />
                )}
            </div>

            {isBlurred && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        background: "rgba(0,0,0,0.8)",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "20px",
                        cursor: "pointer"
                    }}
                    onClick={handleClick}
                    onMouseEnter={():void => setIsHovering(true)}
                    onMouseLeave={():void => setIsHovering(false)}
                >
                    {isHovering ? "I CAN TAKE IT" : contentWarningText}
                </div>
            )}

            {isLoading && (
                <Spinner size={70} style={{
                    position: "absolute",
                    top: "0px",
                    background: "rgba(0,0,0,.5)",
                    zIndex: "10"
                }} />
            )}
        </div>
    );
};

export default Thumbnail;
