import getCurrentUserGridPath from "./getCurrentUserGridPath";

const {join, extname} = window.require("path");
const fs = window.require("fs");
const https = window.require("https");
const Stream = window.require("stream").Transform;
const glob = window.require("glob");

const addAsset = async (type, appId, url):Promise<void> => {
    const userGridPath = await getCurrentUserGridPath();

    return new Promise<void>((resolve, reject) => {
        const imageUrl = url;
        const imageExt = extname(imageUrl);

        let dest;

        switch (type) {
            case "horizontalGrid":
                dest = join(userGridPath, `${appId}${imageExt}`);
                break;
            case "verticalGrid":
                dest = join(userGridPath, `${appId}p${imageExt}`);
                break;
            case "hero":
                dest = join(userGridPath, `${appId}_hero${imageExt}`);
                break;
            case "logo":
                dest = join(userGridPath, `${appId}_logo${imageExt}`);
                break;
            default:
                reject();
        }

        let cur = 0;
        const data = new Stream();
        let progress = 0;
        let lastProgress = 0;
        https.get(url, (response) => {
            const len = parseInt(response.headers["content-length"], 10);

            response.on("data", (chunk) => {
                cur += chunk.length;
                data.push(chunk);
                progress = Math.round((cur / len) * 10) / 10;
                if (progress !== lastProgress) {
                    lastProgress = progress;
                }
            });

            response.on("end", () => {
                // Delete old image(s)
                glob(`${dest.replace(imageExt, "")}.*`, (er, files) => {
                    files.forEach((file) => {
                        fs.unlinkSync(file);
                    });

                    fs.writeFileSync(dest, data.read());
                    resolve();
                });
            });
        }).on("error", (err) => {
            fs.unlink(dest);
            reject(err);
        });
    });
};

export default addAsset;
