import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table, TableClass } from 'aws-cdk-lib/aws-dynamodb';
import { join } from 'path';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaIntegration, TokenAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new apigateway.RestApi(this, 'test-api', {
      description: 'Test project',
      deployOptions: {
        stageName: 'dev',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // replace with calling origin
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const storesTable = new Table(this, 'stores-table', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableClass: TableClass.STANDARD_INFREQUENT_ACCESS,
      tableName: 'stores',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const nodejsProps: NodejsFunctionProps = {
      depsLockFilePath: join(__dirname, '..', 'package-lock.json'),
      environment: {
        STORE_PRIMARY_KEY: 'id',
        STORE_TABLE_NAME: storesTable.tableName,
      },
    };

    const medium_username = ssm.StringParameter.fromStringParameterName(this, 'medium_username', 'medium_username');
    const medium_password = ssm.StringParameter.fromStringParameterName(this, 'medium_password', 'medium_password');

    const authorizerFn = new NodejsFunction(this, 'BasicAuthAuthorizer', {
      entry: join(__dirname, '..', 'lambda', '/authorizer.ts'),
      handler: 'authorizer',
      environment: {
        medium_username: medium_username.stringValue,
        medium_password: medium_password.stringValue,
      },
    });

    const authorizer = new TokenAuthorizer(this, 'token-authorizer', {
      handler: authorizerFn,
      identitySource: 'method.request.header.Authorization',
    });

    const getOneLambda = new NodejsFunction(this, 'getOneStoreFunction', {
      entry: join(__dirname, '..', 'lambda', 'get-one.ts'),
      ...nodejsProps,
    });

    const getAllLambda = new NodejsFunction(this, 'getAllStoresFunction', {
      entry: join(__dirname, '..', 'lambda', 'get-all.ts'),
      ...nodejsProps,
    });

    const createOneLambda = new NodejsFunction(this, 'createStoreFunction', {
      entry: join(__dirname, '..', 'lambda', 'create.ts'),
      ...nodejsProps,
    });

    const updateOneLambda = new NodejsFunction(this, 'updateStoreFunction', {
      entry: join(__dirname, '..', 'lambda', 'update-one.ts'),
      ...nodejsProps,
    });

    const deleteOneLambda = new NodejsFunction(this, 'deleteStoreFunction', {
      entry: join(__dirname, '..', 'lambda', 'delete-one.ts'),
      ...nodejsProps,
    });

    [createOneLambda, getAllLambda, getOneLambda, updateOneLambda, deleteOneLambda].forEach((i) => storesTable.grantReadWriteData(i));

    const getAllIntegration = new LambdaIntegration(getAllLambda, { proxy: true });
    const createOneIntegration = new LambdaIntegration(createOneLambda, { proxy: true });
    const getOneIntegration = new LambdaIntegration(getOneLambda, { proxy: true });
    const updateOneIntegration = new LambdaIntegration(updateOneLambda, { proxy: true });
    const deleteOneIntegration = new LambdaIntegration(deleteOneLambda, { proxy: true });

    const store = api.root.addResource('store');

    store.addMethod('POST', createOneIntegration, { authorizer });
    store.addMethod('GET', getAllIntegration, { authorizer });

    const singleStore = store.addResource('{id}');
    singleStore.addMethod('GET', getOneIntegration, { authorizer });
    singleStore.addMethod('PATCH', updateOneIntegration, { authorizer });
    singleStore.addMethod('DELETE', deleteOneIntegration, { authorizer });

    new cdk.CfnOutput(this, 'apiUrl', { value: api.url });
  }
}
