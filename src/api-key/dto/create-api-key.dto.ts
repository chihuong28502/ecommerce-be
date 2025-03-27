import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;
}
export class CreateArrApiKeyDto {
  @ApiProperty()
  @IsNotEmpty()
  keys: [string];
}
