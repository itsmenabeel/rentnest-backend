import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import routes from './routes';
import { openApiSpec } from './docs/openapi';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL }));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get('/api/docs.json', (_req, res) => res.json(openApiSpec));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);
