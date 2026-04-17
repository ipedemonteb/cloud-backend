import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CognitoStrategy } from './strategies/cognito.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'cognito' })],
  providers: [CognitoStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
