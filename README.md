# Create username and password for our basic auth token authoriser

```
aws ssm put-parameter --name "medium_username" --value "medium_username" --type String
aws ssm put-parameter --name "medium_password" --value "medium_password" --type String
```
