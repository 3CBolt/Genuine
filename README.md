# Genuine Verify

A privacy-first human verification widget built with Next.js and TensorFlow.js. This widget provides a seamless, user-friendly way to verify human presence using face detection and gesture (head tilt) verification.

## Features

- Real-time face detection using BlazeFace (TensorFlow.js)
- Head tilt gesture verification for robust human presence
- Privacy-focused design - all processing happens client-side
- Smooth, intuitive user interface with clear feedback
- Responsive design that works across devices
- Built with modern web technologies

## Tech Stack

- Next.js 14
- React 18
- TensorFlow.js
- BlazeFace (face detection)
- Tailwind CSS
- TypeScript

## Detection & Verification Flow

1. **Face Detection:**
   - Uses BlazeFace for fast, robust face presence detection.
   - Draws a bounding box and eye landmarks on the video feed.
2. **Head Tilt Verification:**
   - Calculates the angle between the eyes in real time.
   - If the user tilts their head left or right (angle > 15°), verification is considered successful.
   - Status updates to "Human Verified" and the app proceeds to the next step.
3. **Fallback:**
   - If no face is detected, the user is prompted to adjust their position.

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
│   └── styles/           # Global styles
├── public/               # Static assets
└── package.json          # Project dependencies
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
- BlazeFace team for the robust face detection model
- Next.js team for the fantastic framework
