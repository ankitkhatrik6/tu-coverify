<div align="center">

# 📄 TU Coverify

**Stop wasting time formatting lab report documents.**  
Generate pixel-perfect, print-ready **Tribhuvan University** cover pages and lab indexes in seconds — with live preview, multiple export formats, and your college logo.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Typst](https://img.shields.io/badge/Typst-Engine-239DAD?style=for-the-badge&logo=typst&logoColor=white)](https://typst.app/)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)

<br/>

> Built by **[Ankit Khatri KC](https://github.com/ankitkhatrik6)** — a BSc CSIT student who got tired of rebuilding the same cover page every semester. 🎓

</div>

---

## ✨ What is this?

TU Coverify is a web app I built to solve a problem every TU student faces — spending 20+ minutes reformatting a Word document just to get a properly aligned cover page. This tool generates the **exact official TU lab report cover page layout and lab index tables** using the Typst typesetting engine, with real-time preview and one-click export.

Fill in your details → preview instantly → download. That's it.

---

## 🚀 Features

- ⚡ **Real-time live preview** — Document renders as you type with an optimized asynchronous Typst engine
- 📑 **Lab Index Generator** — Generate dynamic multi-row lab indexes with reorderable lists
- 📥 **5 export formats** — PDF, DOCX, PNG, JPG, and raw Typst source
- 🏫 **College logo upload** — Drag & drop your college logo (PNG, JPG, SVG)
- 🌙 **Dark mode** — Full light/dark theme with localStorage persistence
- 📐 **Standard A4 layout** — Portrait orientation, Times New Roman, metric-perfect spacing
- 🚀 **SEO Optimized** — Professional OpenGraph and Twitter meta tags for perfect link sharing
- 🖨️ **Direct print** — Print the PDF straight from the browser

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.9 |
| Typesetting | Typst (self-hosted binary in `/bin`) |
| Styling | Tailwind CSS v4 |
| Animations | Motion (Framer Motion) |
| DOCX Export | docx.js |
| Icons | Lucide React |

---

## 📦 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** (comes with Node)

### Run in Development

```bash
# Clone the repository
git clone https://github.com/ankitkhatrik6/tu-coverify.git
cd tu-coverify

# Install dependencies
npm install

# Start dev server with hot-reload
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run in Production (Host on Network)

```bash
# Build the optimized production bundle
npm run build

# Start the server (accessible on your local network)
npx next start -H 0.0.0.0 -p 3000
```

Other devices on your network can access it at `http://<your-ip>:3000`.

---

## 📁 Project Structure

```
tu-coverify/
├── app/
│   ├── api/compile/      # Typst compilation API route
│   ├── page.tsx          # Main application UI
│   ├── layout.tsx        # Root layout & metadata
│   └── globals.css       # Global styles
├── bin/
│   └── typst             # Typst binary (self-hosted)
├── lib/
│   ├── docx-generator.ts       # DOCX export engine for Cover Pages
│   ├── docx-index-generator.ts # DOCX export engine for Lab Index
│   └── utils.ts                # Utility helpers
├── public/
│   ├── default_college_logo.svg
│   └── tu_logo.svg
└── hooks/
    └── use-mobile.ts
```

---

## 📸 Preview

> Real-time compilation — what you fill in is exactly what gets printed.

The live preview panel renders a full SVG of your cover page within ~450ms of each keystroke, powered by the embedded Typst engine running server-side.

---

## 🤝 Contributing

Found a bug or want to add a feature? Feel free to open an issue or submit a PR.

1. Fork the repo
2. Create your branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push and open a Pull Request

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ by **Ankit Khatri KC**

*BSc CSIT Student — Tribhuvan University*

</div>
