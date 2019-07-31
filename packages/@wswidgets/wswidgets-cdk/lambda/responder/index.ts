import {ApiGatewayManagementApi} from 'aws-sdk';

const cm = new ApiGatewayManagementApi({
    endpoint: `${process.env.API_ID}.execute-api.us-east-1.amazonaws.com/prod`
});

interface WsWidgetResponderEvent {
    connectionId: string;
    messageId: string;
    status: string;
    response?: object;
}

export async function handler (event: WsWidgetResponderEvent) {
    const {messageId, status, response} = event;

    await cm.postToConnection({
        ConnectionId: event.connectionId,
        Data: Buffer.from(JSON.stringify({messageId, status, response}))
    }).promise();
}
