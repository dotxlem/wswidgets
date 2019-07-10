import {IChainable, INextable, State, StateMachine, StateMachineFragment, Task} from '@aws-cdk/aws-stepfunctions';
import {InvokeFunction} from '@aws-cdk/aws-stepfunctions-tasks';
import {Effect, PolicyStatement, Role, ServicePrincipal} from '@aws-cdk/aws-iam';
import {StateMachineIntegration, WsApi} from '@wswidgets/wsapi-cdk';
import {NanoService} from './NanoService';
import {WsWidgets} from './WsWidgets';

export class Widget extends StateMachineFragment {

    private api: WsApi;
    private smi: StateMachineIntegration;
    private sm: StateMachine;

    // From StateMachineFragment
    public startState: State;
    public endStates: INextable[];

    // Services
    private stages: (IChainable & INextable)[] = [];
    public readonly ingest: Task;
    public readonly responder: Task;

    constructor (scope: WsWidgets, id: string) {
        super(scope, id);
        this.api = scope.api;

        this.ingest = new Task(this, 'Ingest', {
            task: new InvokeFunction(scope.ingest.function)
        });

        this.responder = new Task(this, 'Responder', {
            task: new InvokeFunction(scope.responder.function)
        });

        this.startState = this.ingest;
        this.endStates = [this.responder];
    }

    public chain (svc: NanoService | Widget) {
        if (!(svc instanceof Widget)) {
            this.stages.push(new Task(this, `Stage${this.stages.length + 1}`, {task: new InvokeFunction(svc.function)}));
        } else {
            // TODO
        }

        this.updateChain();
        return this;
    }

    // public fork () {
    //     return this;
    // }

    public get asStateMachine () {
        if (!this.sm) {
            this.sm = new StateMachine(this, 'StateMachine', {
                definition: this
            })
        }

        return this.sm;
    }

    public get asIntegration () {
        const role = new Role(this, 'IntegrationRole', {
            assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
        });

        const stmt = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['states:*', 'lambda:*'],
            resources: ['*']
        });

        role.addToPolicy(stmt);

        if (!this.smi) {
            this.smi = new StateMachineIntegration(this, 'Integration', {
                apiId: this.api.apiId,
                stateMachine: this.asStateMachine,
                role
            });
        }

        return this.smi;
    }


    protected validate (): string[] {
        if (!this.stages.length) {
            return ['Widget must have at least one stage defined.']
        }

        return [];
    }

    private updateChain () {
        this.stages.forEach((stage, idx) => (idx === 0) ? this.ingest.next(stage) : this.stages[idx - 1].next(stage));
        (this.stages.length) ? this.stages[this.stages.length - 1].next(this.responder) : this.ingest.next(this.responder);
    }

}
