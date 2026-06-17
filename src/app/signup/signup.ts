import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})

export class Signup {
  signupForm: FormGroup; 

  constructor(private fb: FormBuilder, private router: Router) {
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  handleSubmit() {
    if (this.signupForm.valid) {
      const formValues = this.signupForm.value;
      localStorage.setItem('signupData', JSON.stringify(formValues));
      this.router.navigate(['/login']);
    } else {
      console.log('error');
    }
  }

}
