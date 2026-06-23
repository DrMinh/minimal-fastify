import { FastifyInstance } from "fastify";
import { Socket, Server as SocketIOServer } from "socket.io";
import { WebsocketClientEventName, WebsocketRoom, WebsocketServerEventName } from "../types/index.js";
import { WebsocketJoinRoomSchema, WebsocketJoinRoomType } from "../schemas/websocket.schema.js";
import Value from "typebox/value";

export class WebsocketService {
    public io: SocketIOServer;

    constructor(public fastify: FastifyInstance) {
        this.io = new SocketIOServer(this.fastify.envs.WEBSOCKET_PORT, {
            transports: ['websocket', 'polling'],
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
    }

    async start() {

        this.io.on("connection", (socket) => {
            socket.on("ping", () => {
                socket.emit("pong");
            });

            socket.on(
                WebsocketClientEventName.JOIN_ROOM,
                (message) => this.joinRoom(message, socket).catch(e => console.log(e))
            )
        });

    }

    async joinRoom(message: WebsocketJoinRoomType, socket: Socket) {

        // check message format
        Value.Assert(WebsocketJoinRoomSchema, message);

        // join the room
        socket.join(message.roomName);

        // response success result
        this.io.to(socket.id).emit(
            WebsocketServerEventName.JOIN_ROOM_SUCCESS,
            { result: true }
        );
    }

    async sendMessage(roomName: WebsocketRoom, event: WebsocketServerEventName, message: any) {
        this.io.to(roomName).emit(
            event,
            message
        );
    }
}
