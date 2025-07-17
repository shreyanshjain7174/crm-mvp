import { FastifyInstance } from 'fastify';
import { JWT } from '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    jwt: JWT;
  }
}