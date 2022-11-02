import { APIGatewayTokenAuthorizerHandler } from 'aws-lambda';

export const authorizer: APIGatewayTokenAuthorizerHandler = async (event: any) => {
  const token = event.authorizationToken;
  let effect = 'Allow';

  if (
    compareTokenWithCredentials(
      token,
      process.env.medium_username as string, // environment variable from ssm in myStack.ts
      process.env.medium_password as string
    )
  ) {
    effect = 'Allow';
  }

  return {
    principalId: 'user',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: '*', // best practice is to limit this to your api gateway arn
        },
      ],
    },
  };
};

const btoa = (str: string) => Buffer.from(str).toString('base64');
const compareTokenWithCredentials = (token: string, user: string, pass: string) => token === `Basic ${btoa(`${user}:${pass}`)}`;

export default authorizer;
