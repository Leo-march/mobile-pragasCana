import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of, from } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TokenService } from '../services/token.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private http: HttpClient, private tokenService: TokenService) {}

  canActivate(): Observable<boolean | UrlTree> {
    return from(this.tokenService.getToken()).pipe(
      switchMap(token => {
        if (!token) return of(this.router.createUrlTree(['/login']));
        return this.http.post(`${environment.apiUrl}/usuarios/verificar`, { token }).pipe(
          map(() => true),
          catchError(() => of(this.router.createUrlTree(['/login'])))
        );
      })
    );
  }
}
