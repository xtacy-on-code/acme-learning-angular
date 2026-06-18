import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})

export class Signup {
  signupForm: FormGroup; 

  constructor(private fb: FormBuilder, private router: Router, private auth: Auth) {
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  handleSubmit() {
    if (this.signupForm.valid) {
      this.auth.signup(this.signupForm.value).subscribe({
        next: (response) => {
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.log('error signing in: ', err);
        }
      });
      
      
    } else {
      console.log('error');
    }
  }

}
