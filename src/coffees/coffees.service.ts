import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';

@Injectable()
export class CoffeesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const coffees = await this.prisma.coffee.findMany({
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return coffees.map(coffee => ({
      ...coffee,
      tags: coffee.tags.map(coffeeTag => coffeeTag.tag),
    }));
  }

  async findOne(id: string) {
    const coffee = await this.prisma.coffee.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!coffee) {
      throw new NotFoundException(`Coffee with ID ${id} not found`);
    }

    return {
      ...coffee,
      tags: coffee.tags.map(coffeeTag => coffeeTag.tag),
    };
  }

  async create(createCoffeeDto: CreateCoffeeDto) {
    const { name, description, price, imageUrl, tags } = createCoffeeDto;
  
    const coffee = await this.prisma.coffee.create({
      data: {
        name,
        description,
        price,
        imageUrl,
        tags: {
          create: tags.map(tagId => ({
            tag: {
              connect: { id: tagId },
            },
          })),
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  
    return {
      ...coffee,
      tags: coffee.tags.map(coffeeTag => coffeeTag.tag),
    };
  }

  //UPDATE
  async update(id: string, updateCoffeeDto: UpdateCoffeeDto) {
    const { tagIds, ...rest } = updateCoffeeDto;
  
    const coffeeExists = await this.prisma.coffee.findUnique({ where: { id } });
    if (!coffeeExists) {
      return null;
    }
  
    await this.prisma.coffeeTag.deleteMany({
      where: { coffeeId: id },
    });
  
    const coffee = await this.prisma.coffee.update({
      where: { id },
      data: {
        ...rest,
        tags: tagIds
          ? {
              create: tagIds.map(tagId => ({
                tag: {
                  connect: { id: tagId },
                },
              })),
            }
          : undefined,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  
    return {
      ...coffee,
      tags: coffee.tags.map(coffeeTag => coffeeTag.tag),
    };
  }
  

  async remove(id: string) {
    //  1 - Verificar se o café existe
    const coffee = await this.prisma.coffee.findUnique({
      where:{id}
    })
    if (!coffee){
      return false
    }
    // 2 - Remover o café
    await this.prisma.coffee.delete({
      where:{id}
    })
    return true
  }

  async searchCoffees(params: {
    start_date?: Date;
    end_date?: Date;
    name?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }) {
    const { start_date, end_date, name, tags, limit = 10, offset = 0 } = params;
  
    // Construindo o filtro condicionalmente
    const where: any = {};
  
    if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) {
        where.createdAt.gte = start_date;
      }
      if (end_date) {
        where.createdAt.lte = end_date;
      }
    }
  
    if (name) {
      // Busca parcial, case insensitive (Postgres usa ilike)
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }
  
    if (tags && tags.length > 0) {
      // Filtra cafés que tenham pelo menos uma das tags informadas
      where.tags = {
        some: {
          tag: {
            name: {
              in: tags,
              mode: 'insensitive', // para garantir case insensitive
            },
          },
        },
      };
    }
  
    // Buscar os cafés com paginação e incluir tags
    const coffees = await this.prisma.coffee.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      skip: offset,
      take: limit,
    });
  
    // Contar o total de cafés para paginação
    const total = await this.prisma.coffee.count({ where });
  
    // Formatar a resposta para retornar só as tags "planas"
    const data = coffees.map(coffee => ({
      ...coffee,
      tags: coffee.tags.map(ct => ct.tag),
    }));
  
    return {
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + data.length < total,
      },
    };
  }
  
} 