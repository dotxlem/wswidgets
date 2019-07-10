import * as crypto from 'crypto';
import {Construct, Lazy, Stack} from '@aws-cdk/core';
import {CfnDeploymentV2} from '@aws-cdk/aws-apigateway';
import {WsApi} from './WsApi';

export class Deployment extends Construct {

    private readonly resource: CfnDeploymentV2;
    private readonly originalLogicalId: string;
    private toHash: any[] = [];

    public deploymentId: string;

    constructor (scope: WsApi, id: string, props: {apiId: string}) {
        super(scope, id);

        this.resource = new CfnDeploymentV2(this, 'Resource', {
            apiId: props.apiId
        });

        this.deploymentId = Lazy.stringValue({ produce: () => this.resource.ref });
        this.originalLogicalId = Stack.of(this).getLogicalId(this.resource);
    }

    public addToHash(data: any) {
        if (this.node.locked) {
            throw new Error('Cannot modify the logical ID when the construct is locked');
        }

        this.toHash.push(data);
    }

    protected prepare(): void {
        if (this.toHash.length) {
            const md5 = crypto.createHash('md5');
            this.toHash
                // .map(c => Stack.of(this).resolve(c))
                .forEach(c => md5.update(JSON.stringify(c)));

            this.resource.overrideLogicalId(this.originalLogicalId + md5.digest('hex'))
        }
    }

}
