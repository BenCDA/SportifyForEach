import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import yaml from 'yaml';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import authRouter from './modules/auth/auth.route';
import usersRouter from './modules/users/users.route';
import sessionsRouter from './modules/sessions/sessions.route';
import bookingsRouter from './modules/bookings/bookings.route';
import sportsRouter from './modules/sports/sports.route';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const openapiPath = path.join(__dirname, 'openapi.yaml');
if (fs.existsSync(openapiPath)) {
  const openapiDoc = yaml.parse(fs.readFileSync(openapiPath, 'utf-8')) as Record<string, unknown>;
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
}

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/sports', sportsRouter);

app.use(errorHandler);

if (process.env['NODE_ENV'] !== 'test') {
  app.listen(env.port, () => {
    console.info(`Server running on http://localhost:${env.port}`);
    console.info(`Swagger UI available at http://localhost:${env.port}/api/docs`);
  });
}

export default app;
