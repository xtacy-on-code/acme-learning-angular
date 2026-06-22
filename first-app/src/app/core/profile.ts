import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Profile {
  constructor(private http: HttpClient) {}

  private apiURL = 'http://localhost:5000/api/profile';

  getProfile() {
    return this.http.get(this.apiURL);
  }

  updateProfile(data: any) {
    return this.http.put(this.apiURL, data);
  }

  // Uploading a file is different from sending JSON. A file is binary data, so
  // we wrap it in a FormData object, which makes the browser send the request
  // as `multipart/form-data`. The field name 'image' MUST match the backend's
  // upload.single('image'). Note: we do NOT set a Content-Type header here —
  // the browser sets it automatically along with the multipart "boundary"
  // marker. Setting it by hand would break the upload.
  uploadImage(file: File) {
    const form = new FormData();
    form.append('image', file);
    return this.http.post(`${this.apiURL}/image`, form);
  }
}
