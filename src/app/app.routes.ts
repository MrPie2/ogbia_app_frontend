import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./home/home.page').then(m => m.HomePage) },
  { path: 'welcome', loadComponent: () => import('./welcome/welcome.page').then(m => m.WelcomePage) },
  { path: 'login', loadComponent: () => import('./login/login.page').then(m => m.LoginPage) },
  { path: 'friends', loadComponent: () => import('./friends/friends.page').then(m => m.FriendsPage) },
  { path: 'profile', loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage) },
  { path: 'cdc', loadComponent: () => import('./cdc/cdc.page').then(m => m.CdcPage) },
  { path: 'constituency', loadComponent: () => import('./constituency/constituency.page').then(m => m.ConstituencyPage) },
  { path: 'create-post', loadComponent: () => import('./create-post/create-post.page').then(m => m.CreatePostPage) },
  { path: 'create-story', loadComponent: () => import('./create-story/create-story.page').then(m => m.CreateStoryPage) },
  { path: 'reps', loadComponent: () => import('./reps/reps.page').then(m => m.RepsPage) },
  { path: 'get_started', loadComponent: () => import('./signup/signup.page').then(m => m.SignupPage) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
