import { Express } from 'express';
declare const server: Express;
declare function bootstrap(): Promise<import("@nestjs/common").INestApplication<any>>;
export default function handler(req: any, res: any): Promise<void>;
export { server, bootstrap };
