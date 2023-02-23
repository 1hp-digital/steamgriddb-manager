const {join} = window.require("path");
const fs = window.require("fs");

const getCustomImage = (type, userdataGridPath, appid):string|boolean => {
    const fileTypes = ["png", "jpg", "jpeg", "tga"];

    let basePath;
    switch (type) {
        case "horizontalGrid":
            basePath = join(userdataGridPath, `${String(appid)}`);
            break;
        case "verticalGrid":
            basePath = join(userdataGridPath, `${String(appid)}p`);
            break;
        case "hero":
            basePath = join(userdataGridPath, `${String(appid)}_hero`);
            break;
        case "logo":
            basePath = join(userdataGridPath, `${String(appid)}_logo`);
            break;
        default:
            basePath = join(userdataGridPath, `${String(appid)}`);
    }

    let image:string|boolean = false;

    fileTypes.some((ext) => {
        const path = `${basePath}.${ext}`;

        if (fs.existsSync(path)) {
            image = path;
            return true;
        }
        return false;
    });

    return image;
};

export default getCustomImage;
