const atob = require('atob');

interface WsWidgetIngestEvent {
    connectionId: string;
    messageId: string;
    payload: string;
}

export async function handler (event: WsWidgetIngestEvent) {
    return {
        connectionId: event.connectionId,
        messageId: JSON.parse(atob(event.messageId)),
        payload: JSON.parse(atob(event.payload))
    }
}
