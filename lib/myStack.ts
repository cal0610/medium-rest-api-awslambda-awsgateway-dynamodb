import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import {
  AttributeType,
  BillingMode,
  Table,
  TableClass,
} from 'aws-cdk-lib/aws-dynamodb';
import { join } from 'path';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';

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
    });

    const nodejsProps: NodejsFunctionProps = {
      depsLockFilePath: join(__dirname, '..', 'package-lock.json'),
      environment: {
        STORE_PRIMARY_KEY: 'id',
        STORE_TABLE_NAME: storesTable.tableName,
      }
    };

    const getOneLambda = new NodejsFunction(this, 'getOneStoreFunction', {
      entry: join(__dirname, '..', 'get-one.ts'),
      ...nodejsProps,
    });

    const getAllLambda = new NodejsFunction(this, 'getAllStoresFunction', {
      entry: join(__dirname, '..', 'get-all.ts'),
      ...nodejsProps,
    });

    const createOneLambda = new NodejsFunction(this, 'createStoreFunction', {
      entry: join(__dirname, '..', 'create.ts'),
      ...nodejsProps,
    });
    
    const updateOneLambda = new NodejsFunction(this, 'updateStoreFunction', {
      entry: join(__dirname, '..', 'update-one.ts'),
      ...nodejsProps,
    });

    const deleteOneLambda = new NodejsFunction(this, 'deleteStoreFunction', {
      entry: join(__dirname, '..', 'delete-one.ts'),
      ...nodejsProps,
    });

  }
}
