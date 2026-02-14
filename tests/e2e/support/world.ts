import { setWorldConstructor, type IWorldOptions } from '@cucumber/cucumber';
import type { Page } from 'playwright';

export class CustomWorld {
  page?: Page;
  baseUrl: string;

  constructor(options: IWorldOptions) {
    this.baseUrl = process.env.BASE_URL ?? 'http://localhost:5173';
  }
}

setWorldConstructor(CustomWorld);

export type { CustomWorld };
