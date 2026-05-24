import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  isEditing = signal(false);

  profile = { name: '', age: '', medicalCondition: '', biographicalDetails: '' };

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    if (this.auth.username) this.profile.name = this.auth.username;
  }

  toggleEdit(): void { this.isEditing.update(v => !v); }
  logout(): void { this.auth.logout(); }
}
