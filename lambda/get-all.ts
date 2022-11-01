import * as AWS from 'aws-sdk';

const TABLE_NAME = process.env.STORE_TABLE_NAME || '';

const db = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any): Promise<any> => {
  const params = {
    TableName: TABLE_NAME,
  };

  try {
    const response = await db.scan(params).promise();
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response.Items),
    };
  } catch (dbError: any) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};
