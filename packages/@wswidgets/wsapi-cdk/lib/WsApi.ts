import {Construct} from '@aws-cdk/core';
import {CfnApiV2, CfnRouteV2, CfnStageV2} from '@aws-cdk/aws-apigateway';
import {IIntegration} from './Integration';
import {Deployment} from './Deployment';

export interface WsApiProps {
    apiName: string;
    routeKey?: string;
}

export class WsApi extends Construct {

    private readonly apiResource: CfnApiV2;
    private readonly apiDeployment: Deployment;
    public readonly apiStage: CfnStageV2;
    public readonly apiId: string;

    constructor (scope: Construct, id: string, props: WsApiProps) {
        super(scope, id);

        this.apiResource = new CfnApiV2(this, 'API', {
            name: props.apiName,
            protocolType: 'WEBSOCKET',
            routeSelectionExpression: `$request.body.${props.routeKey || 'action'}`
        });
        this.apiId = this.apiResource.ref;

        this.apiDeployment = new Deployment(this, 'Deployment', {apiId: this.apiId});

        this.apiStage = new CfnStageV2(this, 'Stage', {
            apiId: this.apiId,
            deploymentId: this.apiDeployment.deploymentId,
            stageName: 'prod'
        })
    }

    public addRoute (action: string, integration: IIntegration) {
        const props = {
            apiId: this.apiId,
            routeKey: action,
            target: `integrations/${integration.integrationId}`
        };

        const resource = new CfnRouteV2(this, `${action}Route`, props);
        this.apiDeployment.node.addDependency(resource);
        this.apiDeployment.addToHash({props, i: integration.props})
    }

}
