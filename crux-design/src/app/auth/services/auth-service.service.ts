import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  constructor(private http:HttpClient) { }
  baseUrl = 'http://localhost:8080/user';

  createUser(formData: any){
    return this.http.post(this.baseUrl+'/sign-up', formData);
  } 
}
 