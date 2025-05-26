import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CookiesService {
  private browserAvailable: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.browserAvailable = isPlatformBrowser(this.platformId);
  }

  setCookie(name: string, value: string, expiryDays?: number, path: string = '/', secure: boolean = false, sameSite: 'Lax' | 'Strict' | 'None' = 'Lax'): void {
    if (!this.browserAvailable) return;
    
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    
    if (expiryDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      cookieString += `; expires=${expiryDate.toUTCString()}`;
    }
    
    cookieString += `; path=${path}`;
    
    if (secure) {
      cookieString += '; secure';
    }
    
    cookieString += `; SameSite=${sameSite}`;
    
    document.cookie = cookieString;
  }

  getCookie(name: string): string | null {
    if (!this.browserAvailable) return null;
    
    const nameEQ = `${encodeURIComponent(name)}=`;
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      let c = cookie;
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
    
    return null;
  }

  // Delete a cookie
  deleteCookie(name: string, path: string = '/'): void {
    if (!this.browserAvailable) return;
    
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
  }

  // Clear all cookies (that are accessible by this service)
  clearAllCookies(): void {
    if (!this.browserAvailable) return;
    
    const cookies = document.cookie.split(";");
    
    for (let cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
      this.deleteCookie(name.trim());
    }
  }

  // Store object in cookie as JSON string
  setObjectCookie(name: string, value: any, expiryDays?: number): void {
    try {
      const jsonValue = JSON.stringify(value);
      this.setCookie(name, jsonValue, expiryDays);
    } catch (e) {
      console.error('Error setting object cookie:', e);
    }
  }

  // Get object from cookie
  getObjectCookie<T>(name: string): T | null {
    const cookieValue = this.getCookie(name);
    if (!cookieValue) return null;
    
    try {
      return JSON.parse(cookieValue) as T;
    } catch (e) {
      console.error('Error parsing object cookie:', e);
      return null;
    }
  }
}
