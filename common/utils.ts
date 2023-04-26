export function base64Decode(str: string) {
    return Uint8Array.from(Buffer.from(str, 'base64'));
}

export function base64Encode(bytes: ArrayBuffer) {
    return Buffer.from(bytes).toString('base64');
}

export function hexDecode(str: string) {
    return Uint8Array.from(Buffer.from(str.replace(/0x/g, ''), 'hex'));
}

export function hexEncode(bytes: ArrayBuffer) {
    return Buffer.from(bytes).toString('hex');
}

