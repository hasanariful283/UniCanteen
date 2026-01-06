// Prisma v7 client configuration with PostgreSQL adapter
import 'dotenv/config'
import { PrismaClient } from '@/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

declare global {
  var prisma: PrismaClient | undefined
}

// Create a connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Create the adapter
const adapter = new PrismaPg(pool)

// Initialize PrismaClient with adapter
const prisma = global.prisma || new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma