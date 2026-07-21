/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
