import { Routes } from '@angular/router';
import { Signup } from './features/signup/signup';
import { Login } from './features/login/login';
import { Students } from './features/students/students';
import { Home } from './features/home/home';
import { UserProfile } from './features/profile/profile';
import { MainLayout } from './layout/main-layout/main-layout';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
    { path: 'signup', component: Signup },
    { path: 'login', component: Login },
    {
        path: '',
        component: MainLayout,
        canActivate: [authGuard],
        children: [
            { path: 'students', component: Students },
            { path: 'home', component: Home },
            { path: 'profile', component: UserProfile }
        ]
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];
