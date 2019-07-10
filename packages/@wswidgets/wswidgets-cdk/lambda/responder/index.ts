import {ApiGatewayManagementApi} from 'aws-sdk';

const cm = new ApiGatewayManagementApi({
    endpoint: `${process.env.API_ID}.execute-api.us-east-1.amazonaws.com/prod`
});

interface WsWidgetResponderEvent {
    connectionId: string;
    status: string;
    response?: string;
}

export async function handler (event: WsWidgetResponderEvent) {
    await cm.postToConnection({
        ConnectionId: event.connectionId,
        Data: Buffer.from(JSON.stringify({status: event.status}))
    }).promise();
}
