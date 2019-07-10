import * as path from 'path';
import {App, Stack, StackProps} from '@aws-cdk/core';
import {ICertificate} from '@aws-cdk/aws-certificatemanager';
import {WsApi, WsApiDomainAlias} from '@wswidgets/wsapi-cdk';
import {NanoService} from './NanoService';

export interface WsWidgetsProps extends StackProps {
    apiName: string;
    domainName?: string;
    certificate?: ICertificate;
}

export class WsWidgets extends Stack {

    public readonly api: WsApi;
    public readonly ingest: NanoService;
    public readonly responder: NanoService;

    constructor (scope: App, id: string, props: WsWidgetsProps) {
        super(scope, id, props);

        this.api = new WsApi(this, 'Api', {apiName: props.apiName});
        if (props.domainName && props.certificate) {
            new WsApiDomainAlias(this.api, 'ApiDomainAlias', {
                domainName: props.domainName,
                certificate: props.certificate
            });
        }

        this.ingest = new NanoService(this, 'IngestSvc', {
            pathToCode: path.dirname(require.resolve('@wswidgets/wswidgets-cdk-ingest')),
            awsServices: [],
            environment: {'API_ID': this.api.apiId}
        });

        this.responder = new NanoService(this, 'ResponderSvc', {
            pathToCode: path.dirname(require.resolve('@wswidgets/wswidgets-cdk-responder')),
            awsServices: ['execute-api'],
            environment: {'API_ID': this.api.apiId}
        });
    }

}
