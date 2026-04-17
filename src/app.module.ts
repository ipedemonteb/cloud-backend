import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CognitoAuthGuard } from './auth/guards/cognito-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    AuthModule,

    LoggerModule.forRootAsync({
      useFactory: (cfg: ConfigService) => {
        const isDev = cfg.get('NODE_ENV') !== 'production';
        return {
          pinoHttp: {
            transport: isDev
              ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
              : undefined,
            level: isDev ? 'debug' : 'info',
          },
        };
      },
      inject: [ConfigService],
    }),

    TypeOrmModule.forRootAsync({
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('DB_HOST'),
        port: cfg.get<number>('DB_PORT', 5432),
        username: cfg.get<string>('DB_USERNAME'),
        password: cfg.get<string>('DB_PASSWORD'),
        database: cfg.get<string>('DB_DATABASE'),
        ssl: cfg.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: cfg.get('DB_LOGGING') === 'true',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: CognitoAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
