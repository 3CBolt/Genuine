# Genuine Verify

A privacy-first human verification widget built with Next.js and TensorFlow.js. This widget provides a seamless, user-friendly way to verify human presence using face detection and blink verification.

## Features

- Real-time face detection using MediaPipe FaceMesh
- Privacy-focused design - all processing happens client-side
- Smooth, intuitive user interface with clear feedback
- Responsive design that works across devices
- Built with modern web technologies

## Tech Stack

- Next.js 14
- React 18
- TensorFlow.js
- MediaPipe FaceMesh
- Tailwind CSS
- TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/genuine-verify.git
cd genuine-verify
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Project Structure

```
genuine-verify/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   └── styles/          # Global styles
├── public/              # Static assets
└── package.json         # Project dependencies
```

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- TensorFlow.js team for the amazing machine learning tools
- MediaPipe team for the FaceMesh model
- Next.js team for the fantastic framework
