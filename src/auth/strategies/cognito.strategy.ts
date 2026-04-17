import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class CognitoStrategy extends PassportStrategy(Strategy, 'cognito') {
  constructor(cfg: ConfigService) {
    const region = cfg.getOrThrow<string>('AWS_REGION');
    const userPoolId = cfg.getOrThrow<string>('COGNITO_USER_POOL_ID');
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${issuer}/.well-known/jwks.json`,
      }),
    });
  }

  validate(payload: Record<string, any>) {
    if (payload.token_use !== 'access') {
      throw new UnauthorizedException('Only access tokens are accepted');
    }
    return {
      userId: payload.sub as string,
      email: payload.email as string,
      groups: (payload['cognito:groups'] as string[]) ?? [],
    };
  }
}
