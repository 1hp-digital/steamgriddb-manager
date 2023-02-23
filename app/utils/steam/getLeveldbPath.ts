const {join} = window.require("path");

const getLeveldbPath = ():string => {
    return join(process.env.localappdata, "Steam", "htmlcache", "Local Storage", "leveldb");
};

export default getLeveldbPath;
