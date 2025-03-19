import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #282c34;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
          }
          h1 {
            font-size: 3rem;
            animation: fadeIn 2s ease-in-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        </style>
      </head>
      <body>
        <h1>🚀 Welcome to My NestJS Backend! 🌟</h1>
      </body>
      </html>
    `;
  }
}
