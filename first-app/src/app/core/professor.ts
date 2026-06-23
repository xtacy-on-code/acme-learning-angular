import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

// Thin HTTP wrapper, mirroring core/student.ts but simpler: the grid does
// sorting/filtering/pagination client-side, so getProfessors() takes no params.
@Injectable({
  providedIn: 'root',
})
export class Professor {
  constructor(private http: HttpClient) {}

  private apiURL = 'http://localhost:5000/api/professors';

  getProfessors() {
    return this.http.get(this.apiURL);
  }

  addProfessor(data: any) {
    return this.http.post(this.apiURL, data);
  }

  updateProfessor(id: string, data: any) {
    return this.http.put(`${this.apiURL}/${id}`, data);
  }

  deleteProfessor(id: string) {
    return this.http.delete(`${this.apiURL}/${id}`);
  }

  bulkDeleteProfessors(ids: string[]) {
    return this.http.post(`${this.apiURL}/bulk-delete`, { ids });
  }
}
