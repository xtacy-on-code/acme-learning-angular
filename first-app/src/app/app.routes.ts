import { Routes } from '@angular/router';
import { Signup } from './features/signup/signup';
import { Login } from './features/login/login';
import { Students } from './features/students/students';
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
            // Lazy-loaded so Chart.js ships in the dashboard's own chunk, keeping the
            // initial bundle small (charts aren't needed until /home is visited).
            { path: 'home', loadComponent: () => import('./features/home/home').then((m) => m.Home) },
            { path: 'profile', component: UserProfile }
        ]
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];
