import {Construct} from '@aws-cdk/core';
import {Certificate} from '@aws-cdk/aws-certificatemanager';
import {CfnBasePathMapping, CfnDomainNameV2} from '@aws-cdk/aws-apigateway';
import {WsApi} from './WsApi';

export interface ApiDomainAliasProps {
    domainName: string;
    certificate: Certificate;
}

export class WsApiDomainAlias extends Construct {

    constructor (scope: WsApi, id: string, props: ApiDomainAliasProps) {
        super(scope, id);

        const apiDomain = new CfnDomainNameV2(this, 'ApiDomain', {
            domainName: props.domainName,
            domainNameConfigurations: [{
                certificateArn: props.certificate.certificateArn
            }]
        });

        new CfnBasePathMapping(this, 'PathMapping', {
            domainName: props.domainName,
            restApiId: scope.apiId,
            stage: 'prod' // prod is the default stage name
        }).node.addDependency(apiDomain, scope.apiStage);

        // const target = new ApiTarget(this, 'ApiTarget', {
        //     hostedZoneId: apiDomain.domainNameRegionalHostedZoneId,
        //     dnsName: apiDomain.domainNameRegionalDomainName
        // });
        // target.node.addDependency(apiDomain);

        // new ARecord(this, 'ApiRecord', {
        //     zone,
        //     recordName: props.subDomain,
        //     target: RecordTarget.fromAlias(target)
        // }).node.addDependency(target);
    }

}

// export class ApiTarget extends Construct implements IAliasRecordTarget {
//
//     public readonly hostedZoneId: string;
//     public readonly dnsName: string;
//
//     constructor(parent: Construct, id: string, props: {hostedZoneId: string, dnsName: string}) {
//         super(parent, id);
//
//         this.hostedZoneId = props.hostedZoneId;
//         this.dnsName = props.dnsName;
//     }
//
//     public bind(): AliasRecordTargetConfig {
//         return {
//             hostedZoneId: this.hostedZoneId,
//             dnsName: this.dnsName
//         }
//     }
// }
