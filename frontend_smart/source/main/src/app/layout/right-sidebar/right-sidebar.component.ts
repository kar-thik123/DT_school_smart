import { NgClass } from '@angular/common';
import { Component, ElementRef, OnInit, AfterViewInit, Renderer2, ChangeDetectionStrategy, DOCUMENT, inject, ChangeDetectorRef } from '@angular/core';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { ConfigService } from '@config';
import { DirectionService, InConfiguration, RightSidebarService } from '@core';
import { LocalStorageService } from '@shared/services';
import { UnsubscribeOnDestroyAdapter } from '@shared';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-right-sidebar',
  templateUrl: './right-sidebar.component.html',
  styleUrls: ['./right-sidebar.component.scss'],
  imports: [
    NgClass,
    NgScrollbar,
    MatButtonToggleModule,
    MatSlideToggleModule,
  ],
})
export class RightSidebarComponent
  extends UnsubscribeOnDestroyAdapter
  implements OnInit, AfterViewInit
{
  private document = inject<Document>(DOCUMENT);
  private renderer = inject(Renderer2);
  elementRef = inject(ElementRef);
  private rightSidebarService = inject(RightSidebarService);
  private configService = inject(ConfigService);
  private directionService = inject(DirectionService);
  private localStorageService = inject(LocalStorageService);
  private cdr = inject(ChangeDetectorRef);

  selectedBgColor = 'white';
  maxHeight!: string;
  maxWidth!: string;
  showpanel = false;
  isOpenSidebar!: boolean;
  isDarkSidebar = false;
  isDarTheme = false;
  public innerHeight?: number;
  headerHeight = 60;
  isRtl = false;
  public config!: InConfiguration;
  ngOnInit() {
    this.config = this.configService.configData;
    this.subs.sink = this.rightSidebarService.sidebarState.subscribe(
      (isRunning) => {
        this.isOpenSidebar = isRunning;
        this.cdr.markForCheck();
      }
    );
    this.setRightSidebarWindowHeight();
  }

  ngAfterViewInit() {
    this.selectedBgColor = this.localStorageService.get('choose_skin_active') as string;

    if (this.localStorageService.get('menuOption')) {
      if (this.localStorageService.get('menuOption') === 'menu_dark') {
        this.isDarkSidebar = true;
      } else if (this.localStorageService.get('menuOption') === 'menu_light') {
        this.isDarkSidebar = false;
      }
    }

    if (this.localStorageService.get('theme')) {
      if (this.localStorageService.get('theme') === 'dark') {
        this.isDarTheme = true;
      } else if (this.localStorageService.get('theme') === 'light') {
        this.isDarTheme = false;
      }
    }

    if (this.localStorageService.get('isRtl')) {
      this.isRtl = this.localStorageService.get('isRtl') === 'true' ? true : false;
    }
  }

  selectTheme(e: string) {
    this.selectedBgColor = e;
    const prevTheme = this.elementRef.nativeElement
      .querySelector('.settingSidebar .choose-theme li.active')
      .getAttribute('data-theme');
    this.renderer.removeClass(this.document.body, 'theme-' + prevTheme);
    this.renderer.addClass(this.document.body, 'theme-' + this.selectedBgColor);
    this.localStorageService.set('choose_skin', 'theme-' + this.selectedBgColor);
    this.localStorageService.set('choose_skin_active', this.selectedBgColor);
  }
  lightSidebarBtnClick() {
    this.renderer.removeClass(this.document.body, 'menu_dark');
    this.renderer.removeClass(this.document.body, 'logo-black');
    this.renderer.addClass(this.document.body, 'menu_light');
    this.renderer.addClass(this.document.body, 'logo-white');
    const menuOption = 'menu_light';
    this.localStorageService.set('choose_logoheader', 'logo-white');
    this.localStorageService.set('menuOption', menuOption);
  }
  darkSidebarBtnClick() {
    this.renderer.removeClass(this.document.body, 'menu_light');
    this.renderer.removeClass(this.document.body, 'logo-white');
    this.renderer.addClass(this.document.body, 'menu_dark');
    this.renderer.addClass(this.document.body, 'logo-black');
    const menuOption = 'menu_dark';
    this.localStorageService.set('choose_logoheader', 'logo-black');
    this.localStorageService.set('menuOption', menuOption);
  }
  lightThemeBtnClick() {
    this.renderer.removeClass(this.document.body, 'dark');
    this.renderer.removeClass(this.document.body, 'submenu-closed');
    this.renderer.removeClass(this.document.body, 'menu_dark');
    this.renderer.removeClass(this.document.body, 'logo-black');
    if (this.localStorageService.get('choose_skin')) {
      this.renderer.removeClass(
        this.document.body,
        this.localStorageService.get('choose_skin') as string
      );
    } else {
      this.renderer.removeClass(
        this.document.body,
        'theme-' + this.config.layout.theme_color
      );
    }

    this.renderer.addClass(this.document.body, 'light');
    this.renderer.addClass(this.document.body, 'submenu-closed');
    this.renderer.addClass(this.document.body, 'menu_light');
    this.renderer.addClass(this.document.body, 'logo-white');
    this.renderer.addClass(this.document.body, 'theme-white');
    const theme = 'light';
    const menuOption = 'menu_light';
    this.selectedBgColor = 'white';
    this.isDarkSidebar = false;
    this.localStorageService.set('choose_logoheader', 'logo-white');
    this.localStorageService.set('choose_skin', 'theme-white');
    this.localStorageService.set('theme', theme);
    this.localStorageService.set('menuOption', menuOption);
  }
  darkThemeBtnClick() {
    this.renderer.removeClass(this.document.body, 'light');
    this.renderer.removeClass(this.document.body, 'submenu-closed');
    this.renderer.removeClass(this.document.body, 'menu_light');
    this.renderer.removeClass(this.document.body, 'logo-white');
    if (this.localStorageService.get('choose_skin')) {
      this.renderer.removeClass(
        this.document.body,
        this.localStorageService.get('choose_skin') as string
      );
    } else {
      this.renderer.removeClass(
        this.document.body,
        'theme-' + this.config.layout.theme_color
      );
    }
    this.renderer.addClass(this.document.body, 'dark');
    this.renderer.addClass(this.document.body, 'submenu-closed');
    this.renderer.addClass(this.document.body, 'menu_dark');
    this.renderer.addClass(this.document.body, 'logo-black');
    this.renderer.addClass(this.document.body, 'theme-black');
    const theme = 'dark';
    const menuOption = 'menu_dark';
    this.selectedBgColor = 'black';
    this.isDarkSidebar = true;
    this.localStorageService.set('choose_logoheader', 'logo-black');
    this.localStorageService.set('choose_skin', 'theme-black');
    this.localStorageService.set('theme', theme);
    this.localStorageService.set('menuOption', menuOption);
  }
  setRightSidebarWindowHeight() {
    this.innerHeight = window.innerHeight;
    const height = this.innerHeight - this.headerHeight;
    this.maxHeight = height + '';
    this.maxWidth = '500px';
  }
  onClickedOutside(event: Event) {
    const button = event.target as HTMLButtonElement;
    if (button.id !== 'settingBtn') {
      if (this.isOpenSidebar === true) {
        this.toggleRightSidebar();
      }
    }
  }
  toggleRightSidebar(): void {
    this.rightSidebarService.setRightSidebar(
      (this.isOpenSidebar = !this.isOpenSidebar)
    );
  }
  switchDirection(event: MatSlideToggleChange) {
    const isrtl = String(event.checked);
    if (
      isrtl === 'false' &&
      document.getElementsByTagName('html')[0].hasAttribute('dir')
    ) {
      document.getElementsByTagName('html')[0].removeAttribute('dir');
      this.renderer.removeClass(this.document.body, 'rtl');
      this.directionService.updateDirection('ltr');
    } else if (
      isrtl === 'true' &&
      !document.getElementsByTagName('html')[0].hasAttribute('dir')
    ) {
      document.getElementsByTagName('html')[0].setAttribute('dir', 'rtl');
      this.renderer.addClass(this.document.body, 'rtl');
      this.directionService.updateDirection('rtl');
    }
    this.localStorageService.set('isRtl', isrtl);
    this.isRtl = event.checked;
  }
  setRTLSettings() {
    document.getElementsByTagName('html')[0].setAttribute('dir', 'rtl');
    this.renderer.addClass(this.document.body, 'rtl');
    this.isRtl = true;
    this.localStorageService.set('isRtl', 'true');
  }
  setLTRSettings() {
    document.getElementsByTagName('html')[0].removeAttribute('dir');
    this.renderer.removeClass(this.document.body, 'rtl');
    this.isRtl = false;
    this.localStorageService.set('isRtl', 'false');
  }
}
