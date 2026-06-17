import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  handleSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      const savedValues = JSON.parse(localStorage.getItem('signupData') || '{}');

      if (savedValues.email === email && savedValues.password === password) {
        localStorage.setItem('isLoggedIn', 'true');
        this.router.navigate(['/students']);
      } else {
        console.log('incorrect credentials!');
      }
      
    } else {
      console.log('error');
    }
  }
}
