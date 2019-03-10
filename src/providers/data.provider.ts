import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import * as Constants from '../app/app.constants';

@Injectable()
export class DataProvider {

    constructor(public http: HttpClient) {
    }

    public getAll<T>(url: string): Observable<T> {
        return this.http.get<T>(url, { headers: this.getHeaders() });
    }

    public post<T>(url: string, requestBody: any): Observable<T> {
        return this.http.post<T>(url, requestBody, { headers: this.getHeaders() });
    }

    public update<T>(url: string, requestBody: any): Observable<T> {
        return this.http.put<T>(url, requestBody, { headers: this.getHeaders() });
    }

    public delete<T>(url: string): Observable<T> {
        return this.http.delete<T>(url, { headers: this.getHeaders() });
    }

    private getHeaders(): HttpHeaders {
        let headers: HttpHeaders = new HttpHeaders();
        return headers.set("version", Constants.API_VERSION);

    }

}
