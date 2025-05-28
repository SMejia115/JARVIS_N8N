import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PrincipalViewComponent } from './components/principal-view/principal-view.component';


const routes: Routes = [
  { path: 'chat', component: PrincipalViewComponent },
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }