import { IsUrl,IsNotEmpty,IsString, MinLength,MaxLength,IsNumber,IsPositive,ArrayNotEmpty,IsArray} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCoffeeDto {
  // não pode ser vazio
  @IsNotEmpty()
  @IsString()
  name: string;

  // mínimo de 10 e máximo de 200 caracteres
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(200)
  description: string;

  // número positivo com até 2 casas decimais
  @Type(() => Number) 
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;



  @IsNotEmpty()
  @IsUrl()
  imageUrl: string;

  // deve ser uma URL válida
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tags: string[];
} 