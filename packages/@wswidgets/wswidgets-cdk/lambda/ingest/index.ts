const atob = require('atob');

interface WsWidgetIngestEvent {
    connectionId: string;
    payload: string;
}

export async function handler (event: WsWidgetIngestEvent) {
    return {
        connectionId: event.connectionId,
        payload: JSON.parse(atob(event.payload))
    }
}
