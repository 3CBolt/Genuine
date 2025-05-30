Here’s an updated and more detailed `README.md` for your **Genuine Verify** project. This version reflects your current MVP with BlazeFace, improved verification flow, and clear, structured documentation for contributors or curious developers.

---

````markdown
# Genuine Verify

**Genuine Verify** is a privacy-first human verification widget built with **Next.js**, **React**, and **TensorFlow.js**. It offers a seamless, client-side method to confirm human presence using real-time face detection and a gesture-based verification (head tilt).

This lightweight widget is designed for modern web platforms that need to distinguish humans from bots without relying on invasive CAPTCHAs or backend services. All processing happens in the browser, ensuring a smooth experience and strong privacy guarantees.

---

## ✅ MVP Branch Status

This branch implements a **BlazeFace-based detection pipeline** for maximum reliability and compatibility across modern browsers and devices. It replaces the older MediaPipe FaceMesh model, which proved inconsistent in tfjs runtime environments.

---

## ✨ Features

- Real-time face detection using **BlazeFace**
- **Head tilt gesture** verification (≥ ±15°)
- Fully **client-side processing** (no video sent to any server)
- Clear, dynamic UI feedback for verification steps
- Works across most modern browsers (Safari, Chrome, Firefox)
- Built with **Next.js 14**, **React 18**, **Tailwind CSS**, and **TypeScript**
- Flexible and embeddable as a standalone widget or integrated flow

---

## 🧠 Detection & Verification Flow

### 1. **Face Detection**
- Uses BlazeFace from TensorFlow.js
- Detects presence of a face and tracks key landmarks (eyes, bounding box)
- Draws real-time overlay via HTML5 canvas

### 2. **Head Tilt Gesture**
- Continuously calculates the angle between the eyes
- If user tilts their head left or right beyond ±15°, they are marked as verified
- State updates to `"Human Verified"` and visual UI confirms the result

### 3. **Flow Control**
- Detection halts after success to prevent regression
- Fallback prompts guide user to improve camera positioning if needed
- The success state can be extended to issue tokens or control access (planned in Sprint 3.3)

---

## 🛠 Tech Stack

| Tool             | Purpose                             |
|------------------|-------------------------------------|
| Next.js 14       | App framework with App Router       |
| React 18         | UI rendering and state management   |
| TypeScript       | Type-safe codebase                  |
| Tailwind CSS     | Utility-first styling               |
| TensorFlow.js    | Machine learning runtime            |
| BlazeFace        | Lightweight face detection model    |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/yourusername/genuine-verify.git
cd genuine-verify
npm install # or yarn install
````

### Run Development Server

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` in your browser.

---

## 🧱 Project Structure

```
genuine-verify/
├── public/               # Static files (favicon, images)
├── src/
│   ├── app/              # Next.js App Router (pages, layout)
│   ├── components/       # React components (VideoFeed, StatusOverlay, etc.)
│   ├── lib/              # Detection logic, hooks
│   ├── styles/           # Tailwind/global styles
│   └── types/            # TypeScript interfaces
├── .env.local            # Environment variables (if needed)
├── package.json          # Project metadata and scripts
└── README.md             # This file
```

---

## 📦 Commands

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Compile for production   |
| `npm start`     | Start production server  |
| `npm run lint`  | Run ESLint checks        |

---

## 🤝 Contributing

We welcome contributions! To contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**. See the `LICENSE` file for more information.

---

## 🙌 Acknowledgments

* [TensorFlow.js](https://www.tensorflow.org/js) for the Web ML runtime
* [BlazeFace](https://github.com/tensorflow/tfjs-models/tree/master/blazeface) for fast face detection
* [Next.js](https://nextjs.org) for the production-grade React framework

---

## 🔭 Roadmap

Upcoming features planned:

* Reusable **Presence Token** generation (Sprint 3.3)
* Additional fallback gestures (e.g. smile, mouth open)
* Widget SDK packaging for platform integration
* Optionally customizable themes and branding

```

---

Let me know if you want this version split into a markdown file for direct use, or if you'd like a second section added for **deployment instructions (e.g. Vercel)**.
```
