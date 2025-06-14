import { PartialType } from '@nestjs/mapped-types';
import { CreateCoffeeDto } from './create-coffee.dto';
import { IsOptional, IsArray, ArrayNotEmpty, IsString } from 'class-validator';


export class UpdateCoffeeDto extends PartialType(CreateCoffeeDto) {
  // adicione outros campos
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tagIds?: string[];
} 