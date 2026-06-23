import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface StudentFilters {
  grade?: string;
  gender?: string;
  email?: string;
  phone?: string;
  rollno?: string;
}

@Injectable({
  providedIn: 'root',
})

export class Student {
  constructor(private http: HttpClient) {}

  private apiURL = 'http://localhost:5000/api/students';

  getStudents(page: number = 1, limit: number = 10, search: string = '', filters: StudentFilters = {}, sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc') {
    console.log({
    page,
    limit,
    search,
    filters,
    sortBy,
    sortOrder
  });
    
    const params: Record<string, string | number> = { page, limit, search, sortBy, sortOrder }

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params[key] = value;
      }
    });

    return this.http.get(this.apiURL, {
      params
    });
  }

  getStats() {
    return this.http.get(`${this.apiURL}/stats`);
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

  bulkDeleteStudents(ids: string[]) {
    return this.http.post(`${this.apiURL}/bulk-delete`, { ids });
  }
}