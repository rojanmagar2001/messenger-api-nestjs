import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, catchError, of, switchMap } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
  ) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (context.getType() !== 'http') {
      return false;
    }

    const authHeader = context.switchToHttp().getRequest().headers[
      'authorization'
    ] as string | null;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const authHeaderParts = authHeader.split(' ');

    if (authHeaderParts.length !== 2) {
      return false;
    }

    const jwt = authHeaderParts[1];

    return this.authService.send({ cmd: 'verify-jwt' }, { jwt }).pipe(
      switchMap(({ exp }) => {
        if (!exp) return of(false);

        const TOKEN_EXP_MS = exp * 1000;

        const isJwtValid = Date.now() < TOKEN_EXP_MS;

        return of(isJwtValid);
      }),
      catchError(() => {
        throw new UnauthorizedException();
      }),
    );
  }
}
