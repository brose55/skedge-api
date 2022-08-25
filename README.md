# rest-api

Start developing by 
1. start the mongo containers 
- `sudo systemctl start docker`
- `yarn db`
2. start the server `yarn dev`

When finished run
* `sudo docker-compose -f docker-compose.yml down`

Next testing other routes
18:30

# src/
* app.ts - basically just the listen call

## controllers
* UserController.ts - calls User Service or errors out

## interfaces
* IUserModel.ts - typing for User model

## middleware
* validateResource.ts - Zod validation

## models
* UserModel.ts  - MongoDB models and method calls

## routes
* home-routes.ts - '/',
* index.ts - exports express router
  ### api
  * user-routes.ts - '/api'

## schemas

## services
* UserService.ts  - creates User Model or errors out

## utils
* connection.ts
* logger.ts
