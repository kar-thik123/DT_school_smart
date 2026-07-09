import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillsOverviewComponent } from './skills-overview.component';

describe('SkillsOverviewComponent', () => {
  let component: SkillsOverviewComponent;
  let fixture: ComponentFixture<SkillsOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillsOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SkillsOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
