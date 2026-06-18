import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Student {
  constructor(private http: HttpClient) {}

  private apiURL = 'http://localhost:5000/api/students';

  getStudents() {
    return this.http.get(this.apiURL);
  }

  addStudent(data: any) {
    return this.http.post(this.apiURL, data);
  }

  updateStudent(id: string, data: any) {
    return this.http.put(`${this.apiURL}/${id}`, data);
  }

  deleteStudent(id: string) {
    return this.http.delete(`${this.apiURL}/${id}`);
  }
}