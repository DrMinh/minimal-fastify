import { Static, Type } from "@fastify/type-provider-typebox";
import { WebsocketClientEventName, WebsocketRoom } from "../types/index.js";

/////
export const WebsocketJoinRoomSchema = Type.Object({
    roomName: Type.Enum(WebsocketRoom)
});

export type WebsocketJoinRoomType = Static<typeof WebsocketJoinRoomSchema>;

////