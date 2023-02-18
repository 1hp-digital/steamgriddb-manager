import {crc32} from "crc";

/*
 * Thank you to:
 * - https://gist.github.com/stormyninja/6295d5e6c1c9c19ab0ce46d546e6d0b1
 * - https://gitlab.com/avalonparton/grid-beautification
 */

const generateNewAppId = (exe:string, name:string): number => {
    const key = exe + name;
    const top = BigInt(crc32(key)) | BigInt(0x80000000);
    const shift = (BigInt(top) << BigInt(32) | BigInt(0x02000000)) >> BigInt(32);
    return parseInt(shift.toString(), 10);
};

export default generateNewAppId;
