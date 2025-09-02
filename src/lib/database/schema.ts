import { z } from 'zod';

// User schema for portfolio ownership
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Portfolio schema for user portfolios
export const PortfolioSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Portfolio Property schema for properties in portfolios
export const PortfolioPropertySchema = z.object({
  id: z.string().uuid(),
  portfolioId: z.string().uuid(),
  propertyId: z.string().uuid(),
  addedAt: z.date(),
  notes: z.string().optional(),
  purchasePrice: z.number().optional(),
  purchaseDate: z.date().optional(),
  estimatedValue: z.number().optional(),
  lastValuationDate: z.date().optional(),
  rentalIncome: z.number().optional(),
  expenses: z.number().optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'RENTED', 'UNDER_OFFER']).default('ACTIVE'),
});

// Property schema for stored property data
export const PropertySchema = z.object({
  id: z.string().uuid(),
  address: z.string().min(1),
  postcode: z.string().min(1),
  propertyType: z.string().optional(),
  bedrooms: z.number().optional(),
  floorArea: z.number().optional(),
  epcRating: z.string().optional(),
  lastSalePrice: z.number().optional(),
  lastSaleDate: z.date().optional(),
  estimatedValue: z.number().optional(),
  rentalEstimate: z.object({
    monthly: z.number().optional(),
    yearly: z.number().optional(),
  }).optional(),
  marketData: z.object({
    hpiIndex: z.number().optional(),
    yoyGrowth: z.number().optional(),
    marketPhase: z.string().optional(),
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Portfolio Performance schema for tracking returns
export const PortfolioPerformanceSchema = z.object({
  id: z.string().uuid(),
  portfolioId: z.string().uuid(),
  date: z.date(),
  totalValue: z.number(),
  totalProperties: z.number(),
  totalRentalIncome: z.number(),
  totalExpenses: z.number(),
  netReturn: z.number(),
  capitalGrowth: z.number(),
  rentalYield: z.number(),
});

// Export types
export type User = z.infer<typeof UserSchema>;
export type Portfolio = z.infer<typeof PortfolioSchema>;
export type PortfolioProperty = z.infer<typeof PortfolioPropertySchema>;
export type Property = z.infer<typeof PropertySchema>;
export type PortfolioPerformance = z.infer<typeof PortfolioPerformanceSchema>;

// Database connection configuration
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}
