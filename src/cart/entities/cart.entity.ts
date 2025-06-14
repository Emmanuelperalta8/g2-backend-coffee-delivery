import { Cart as PrismaCart } from '@prisma/client';

export class Cart implements PrismaCart {
  id: string;
  userId: string | null;
  status: string;
  statusPayment: string;
  dataTimeCompleted: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
} 