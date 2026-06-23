import { createHmac } from "crypto";

export function createHashString(password: string, secret: string) {
    return createHmac('sha512', secret).update(password).digest('hex');
}