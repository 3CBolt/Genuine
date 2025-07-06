# Genuine Verify - Privacy-First Human Verification Widget

A real-time, privacy-first human verification widget using React, Next.js, and TensorFlow.js (BlazeFace).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd genuine-verify

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📦 Dependencies

### Core Dependencies
```json
{
  "next": "14.0.0",
  "react": "^18",
  "react-dom": "^18",
  "@tensorflow/tfjs": "^4.11.0",
  "@tensorflow-models/blazeface": "^0.1.0",
  "@tensorflow/tfjs-backend-webgl": "^4.11.0",
  "seedrandom": "^3.0.5"
}
```

### Dev Dependencies
```json
{
  "@types/node": "^20",
  "@types/react": "^18", 
  "@types/react-dom": "^18",
  "eslint": "^8",
  "eslint-config-next": "14.0.0",
  "jest": "^29.7.0",
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^6.1.0",
  "typescript": "^5",
  "tailwindcss": "^3.2.7",
  "autoprefixer": "^10.4.14",
  "postcss": "^8.4.21"
}
```

## ⚙️ Configuration Files

### package.json
```json
{
  "name": "genuine-verify",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### postcss.config.js
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### tailwind.config.ts
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
```

### src/app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. "next: command not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 2. "micromatch.braces is not a function"
- Use object syntax in postcss.config.js (not array syntax)
- Clear npm cache: `npm cache clean --force`

#### 3. "Cannot find module 'postcss-nesting'"
- Remove postcss-nesting from postcss.config.js
- Use simple config with just tailwindcss and autoprefixer

#### 4. "Invalid character in tsconfig.json"
- Replace with the correct tsconfig.json above

#### 5. "PostCSS configuration must export a plugins key"
- Ensure postcss.config.js exports plugins object correctly

#### 6. "Image import is not a valid image file"
- Remove corrupted favicon.ico: `rm src/app/favicon.ico`

### Fresh Start Commands
```bash
# Complete reset
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

## 🔧 Features

- **Real-time face detection** using TensorFlow.js BlazeFace
- **Gesture verification** (blink, head tilt)
- **Presence token system** with persistence
- **Embeddable widget** for easy integration
- **Debug panel** for development
- **Privacy-first** - no data sent to servers

## �� Project Structure
