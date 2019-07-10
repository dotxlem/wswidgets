import {Construct} from '@aws-cdk/core';
import {AssetCode, Function, Runtime} from '@aws-cdk/aws-lambda';
import {Effect, PolicyStatement, Role, ServicePrincipal} from '@aws-cdk/aws-iam';

export interface NanoServiceProps {
    pathToCode: string;
    awsServices: string[];
    handler?: string;
    environment?: {[key: string]: string}
}

export class NanoService extends Construct {

    public readonly function: Function;

    constructor (scope: Construct, id: string, props: NanoServiceProps) {
        super(scope, id);

        const role = new Role(this, 'ServiceRole', {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com')
        });

        const stmt = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['logs:*', ...props.awsServices.map(s => `${s}:*`)],
            resources: ['*']
        });

        role.addToPolicy(stmt);

        this.function = new Function(this, 'Function', {
            code: new AssetCode(props.pathToCode),
            handler: props.handler || 'index.handler',
            runtime: Runtime.NODEJS_10_X,
            environment: props.environment,
            role
        });
    }

}
