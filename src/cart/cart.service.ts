import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class CartService {
  private readonly MIN_QTY = 1;
  private readonly MAX_QTY = 5;

  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId?: string) {
    if (userId) {
      const existingCart = await this.prisma.cart.findFirst({
        where: { userId },
        include: { items: true },
      });
  
      if (existingCart) {
        return existingCart;
      }
    }
  
    return this.prisma.cart.create({
      data: {
        userId: userId || null,
        status: 'Abandonado',       // valor padrão inicial
        statusPayment: 'Pendente',  // valor padrão inicial
      },
      include: { items: true },
    });
  }
  
  async getCart(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            coffee: true,
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException(`Carrinho com id ${cartId} não encontrado`);
    }

    // Calcular subtotal e total para cada item (convertendo Decimal para number)
    const itemsWithSubtotal = cart.items.map(item => ({
      ...item,
      subtotal: item.quantity * item.unitPrice.toNumber(),
    }));

    // Somar total dos itens
    const itemsTotal = itemsWithSubtotal.reduce((acc, item) => acc + item.subtotal, 0);

    // Exemplo fixo de frete, adapte conforme sua regra de negócio
    const shippingFee = 10;

    return {
      id: cart.id,
      userId: cart.userId,
      items: itemsWithSubtotal,
      itemsTotal,
      shippingFee,
      total: itemsTotal + shippingFee,
    };
  }

  async addItem(cartId: string, addItemDto: AddItemDto) {
    const { coffeeId, quantity } = addItemDto;

    // Verificar se o café existe
    const coffee = await this.prisma.coffee.findUnique({
      where: { id: coffeeId },
    });

    if (!coffee) {
      throw new NotFoundException(`Café com ID ${coffeeId} não encontrado`);
    }

    // Verificar se o item já está no carrinho
    const existingItem = await this.prisma.cartItem.findFirst({
      where: { cartId, coffeeId },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > this.MAX_QTY) {
        throw new BadRequestException(`Quantidade máxima de ${this.MAX_QTY} unidades excedida`);
      }

      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    }

    // Criar novo item no carrinho
    return this.prisma.cartItem.create({
      data: {
        cartId,
        coffeeId,
        quantity,
        unitPrice: coffee.price,
      },
    });
  }

  async updateItemQuantity(cartId: string, itemId: string, quantity: number) {
    if (quantity < this.MIN_QTY || quantity > this.MAX_QTY) {
      throw new BadRequestException(`Quantidade deve ser entre ${this.MIN_QTY} e ${this.MAX_QTY}`);
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId },
    });

    if (!item) {
      throw new NotFoundException(`Item com ID ${itemId} não encontrado no carrinho ${cartId}`);
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  async removeItem(cartId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId },
    });

    if (!item) {
      throw new NotFoundException(`Item com ID ${itemId} não encontrado no carrinho ${cartId}`);
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return { success: true };
  }
}
