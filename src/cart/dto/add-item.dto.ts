import { IsNotEmpty, IsString, IsInt, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AddItemDto {
  @IsNotEmpty()
  @IsString()
  coffeeId: string;

  @IsNotEmpty()
  @IsString()
  coffeeName: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  quantity: number;

} 