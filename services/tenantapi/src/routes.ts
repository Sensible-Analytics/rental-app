import * as Express from 'express';
import { Controllers } from './controllers/index.js';
import { Middlewares } from '@rentro/common';

const routes = Express.Router();

routes.get('/tenants', Middlewares.asyncWrapper(Controllers.getAllTenants));
routes.get(
  '/tenant/:tenantId',
  Middlewares.asyncWrapper(Controllers.getOneTenant)
);

export default routes;
