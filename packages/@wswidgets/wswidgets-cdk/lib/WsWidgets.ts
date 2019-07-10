import {App, Stack, StackProps} from '@aws-cdk/core';
import {WsApi} from '@wswidgets/wsapi-cdk';
import {NanoService} from './NanoService';

export interface WsWidgetsProps extends StackProps {
    apiName: string;
}

export class WsWidgets extends Stack {

    public readonly api: WsApi;
    public readonly ingest: NanoService;
    public readonly responder: NanoService;

    constructor (scope: App, id: string, props: WsWidgetsProps) {
        super(scope, id, props);

        this.api = new WsApi(this, 'Api', {apiName: props.apiName});
        // new WsApiDomainAlias(this.api, 'ApiDomainAlias', {subDomain: 'gateway'});

        this.ingest = new NanoService(this, 'IngestSvc', {
            pathToCode: './lib/WsWidgets/lambda/ingest',
            awsServices: [],
            environment: {'API_ID': this.api.apiId}
        });

        this.responder = new NanoService(this, 'ResponderSvc', {
            pathToCode: './lib/WsWidgets/lambda/responder',
            awsServices: ['execute-api'],
            environment: {'API_ID': this.api.apiId}
        });
    }

}
