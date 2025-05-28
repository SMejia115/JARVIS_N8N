import { H } from '@angular/cdk/keycodes';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {

  constructor() { }

  private http = inject(HttpClient);
  

  sendRequest(prompt: string): Observable<any> {
    const url = 'https://luckily-intense-husky.ngrok-free.app/webhook/1e8e8f7e-5fe5-4cf2-a8c3-db7bc6dd84bc'
    const body = { prompt: prompt };
    return this.http.post<any>(url, body);
  }

  textToSpeech(text: string): Observable<Blob> {
  return this.http.post('https://luckily-intense-husky.ngrok-free.app/webhook/ab7f570d-a0ab-48f2-8a2b-2c126751054a',
    { texto: text },
    { responseType: 'blob' } 
  );
}
    
  


}
