import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class CheckoutService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
  ) {}

  async createOrder(checkoutDto: CheckoutDto) {
    const { cartId, deliveryAddress, paymentMethod } = checkoutDto;

    const cart = await this.cartService.getCart(cartId);
    if (!cart) {
      throw new NotFoundException(`Carrinho com id ${cartId} não encontrado`);
    }

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const itemsTotal = cart.items.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);
    const shippingFee = 10;
    const totalAmount = itemsTotal + shippingFee;

    const order = await this.prisma.order.create({
      data: {
        cart: { connect: { id: cartId } },
        totalItems,
        shippingFee,
        totalAmount,
        deliveryAddress: deliveryAddress as any, 
        paymentMethod,
        status: 'pending',
      },
      include: {
        cart: {
          include: {
            items: {
              include: {
                coffee: true, 
              },
            },
          },
        },
      },
    });

    return {
      id: order.id,
      items: order.cart.items,
      itemsTotal,
      shippingFee,
      total: totalAmount,
      status: order.status,
      createdAt: order.createdAt,
    };
  }
}
