import { format as formatUrl } from 'url';
import {Construct, Stack, Lazy} from '@aws-cdk/core';
import {IntegrationType, CfnIntegrationV2} from '@aws-cdk/aws-apigateway';
import {Function} from '@aws-cdk/aws-lambda';
import {Role} from '@aws-cdk/aws-iam';
import {StateMachine} from '@aws-cdk/aws-stepfunctions';

export enum IntegrationMethod {
    Get = 'GET',
    Post = 'POST'
}

export interface IIntegration {
    readonly integrationId: string;
    readonly props: any;
}

export interface IIntegrationProps {
    apiId: string;
}

export interface IntegrationProps extends IIntegrationProps {
    integrationType: IntegrationType;
    integrationMethod: IntegrationMethod;
    integrationUri: string;
    credentialsArn?: string;
    templateSelectionExpression?: string;
    requestTemplates?: {[key: string]: string};
}


export class Integration extends Construct implements IIntegration {

    public readonly integrationId: string;
    public readonly props: any;

    constructor (scope: Construct, id: string, props: IntegrationProps) {
        super(scope, id);
        this.props = props;

        const resource = new CfnIntegrationV2(this, 'Integration', {
            apiId: props.apiId,
            integrationType: props.integrationType,
            integrationMethod: props.integrationMethod,
            integrationUri: props.integrationUri,
            credentialsArn: props.credentialsArn,
            requestTemplates: props.requestTemplates,
            templateSelectionExpression: props.templateSelectionExpression
        });
        this.integrationId = resource.ref;
    }

}

export interface AwsIntegrationProps extends IIntegrationProps {
    service: string;
    role: Role;
    proxy?: boolean;
    path?: string;
    action?: string;
    actionParameters?: { [key: string]: string };
    requestTemplates?: {[key: string]: string};
    templateSelectionExpression?: string;
}

export class AwsIntegration extends Integration {

    constructor (scope: Construct, id: string, props: AwsIntegrationProps) {
        if (props.path && props.action) {
            throw new Error(`"path" and "action" props are mutually exclusive`);
        }

        const { apiType, apiValue } = parseAwsApiCall(props.path, props.action, props.actionParameters);

        super(scope, id, {
            apiId: props.apiId,
            credentialsArn: props.role.roleArn,
            templateSelectionExpression: props.templateSelectionExpression,
            requestTemplates: props.requestTemplates,
            integrationType: props.proxy ? IntegrationType.AWS_PROXY : IntegrationType.AWS,
            integrationMethod: IntegrationMethod.Post,
            integrationUri: Lazy.stringValue({produce: () => {
                    return Stack.of(scope).formatArn({
                        service: 'apigateway',
                        account: props.service,
                        resource: apiType,
                        sep: '/',
                        resourceName: apiValue,
                    });
                }})
        });
    }

}

export interface LambdaIntegrationProps extends IIntegrationProps {
    function: Function;
    role: Role;
}

export class LambdaIntegration extends AwsIntegration {
    constructor (scope: Construct, id: string, props: LambdaIntegrationProps) {
        super(scope, id, {
            apiId: props.apiId,
            proxy: true,
            service: 'lambda',
            path: `2015-03-31/functions/${props.function.functionArn}/invocations`,
            role: props.role
        });
    }
}

export interface StepFunctionIntegrationProps extends IIntegrationProps {
    stateMachine: StateMachine;
    role: Role;
}

export class StateMachineIntegration extends AwsIntegration {
    constructor (scope: Construct, id: string, props: StepFunctionIntegrationProps) {
        super(scope, id, {
            apiId: props.apiId,
            service: 'states',
            action: 'StartExecution',
            templateSelectionExpression: 'default',
            requestTemplates: {
                'default': Lazy.stringValue({produce: () => `
                #set($payload = $input.json('$.payload'))
                {
                    "input": "{\\\"connectionId\\\" : \\\"$context.connectionId\\\", \\\"payload\\" : \\\"$util.base64Encode($payload)\\\"}",
                    "stateMachineArn": "${props.stateMachine.stateMachineArn}"
                }
                `})
            },
            role: props.role
        })
    }
}

function parseAwsApiCall (path?: string, action?: string, actionParams?: { [key: string]: string }): { apiType: string, apiValue: string } {
    if (actionParams && !action) {
        throw new Error(`"actionParams" requires that "action" will be set`);
    }

    if (path && action) {
        throw new Error(`"path" and "action" are mutually exclusive (path="${path}", action="${action}")`);
    }

    if (path) {
        return {
            apiType: 'path',
            apiValue: path
        };
    }

    if (action) {
        if (actionParams) {
            action += '&' + formatUrl({ query: actionParams }).substr(1);
        }

        return {
            apiType: 'action',
            apiValue: action
        };
    }

    throw new Error(`Either "path" or "action" are required`);
}
