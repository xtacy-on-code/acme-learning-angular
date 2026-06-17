import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  constructor(private http: HttpClient){}

  private apiURL = 'http://localhost:5000/api/auth';

  signup(data: any) {
    return this.http.post(`${this.apiURL}/signup`, data);
  }

  login(data: any) {
    return this.http.post(`${this.apiURL}/login`, data);
  }
}
