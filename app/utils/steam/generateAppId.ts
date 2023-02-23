import {crc32} from "crc";

const generateAppId = (exe, name):string => {
    const key = exe + name;
    const top = BigInt(crc32(key)) | BigInt(0x80000000);
    return String((BigInt(top) << BigInt(32) | BigInt(0x02000000)));
};

export default generateAppId;
