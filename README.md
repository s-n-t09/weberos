<div align="center">
  <br />
  <a href="https://github.com/s-n-t09/weberos">
    <img src="/logo.png" alt="WeberOS Logo" width="125" height="125">
  </a>
  <h1 align="center">WeberOS v1.7</h1>

  <p align="center">
    <strong>Next-Gen Web-Based Operating System Simulator</strong>
  </p>

  <p align="center">
    <a href="https://react.dev/">
      <img src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    </a>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/TypeScript-5.0-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    </a>
    <a href="https://vitejs.dev/">
      <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    </a>
    <a href="https://tailwindcss.com/">
      <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    </a>
  </p>
</div>

<br />

## 📋 Table of Contents

- [Introduction](#-introduction)
- [Features](#-features)
- [Installation & Setup](#-installation--setup)
- [Usage Guide](#-usage-guide)
- [Project Structure](#-project-structure)
- [Developer Guide](#-developer-guide)
- [API Permissions](#-api-permissions)
- [License](#-license)

---

## 🚀 Introduction

**WeberOS** is a sophisticated operating system simulator that runs entirely in your web browser. Built with performance and aesthetics in mind, it provides a familiar desktop environment complete with window management, a virtual filesystem, and a suite of functional applications.

Whether you want to manage files, write code, listen to music, or customize your environment, WeberOS persists your state locally, giving you a seamless experience every time you return.

---

## ✨ Features

*   **🖥️ Dynamic Window Manager:**
    *   Drag, drop, resize, minimize, and maximize windows.
    *   Z-index handling for active focus.
    *   Taskbar with minimization toggle.

*   **📂 Virtual Filesystem:**
    *   In-memory filesystem stored in `LocalStorage`.
    *   Create files/folders, copy, cut, paste, delete.
    *   Upload files from your real computer to the virtual OS.

*   **📦 Package System (wpm):**
    *   Install new apps via the **Market** (App Store) or **Terminal**.
    *   Manage installed packages and dependencies.

*   **💻 Power Terminal:**
    *   Unix-like commands: `ls`, `cd`, `pwd`, `mkdir`, `touch`, `rm`, `cat`.
    *   Custom command `wpm` for package management.

*   **🎨 Deep Customization:**
    *   Change wallpapers dynamically.
    *   Drag and drop desktop icons.
    *   Create multiple user profiles with password protection.

---

## 🛠️ Installation & Setup

To run WeberOS on your local machine, ensure you have **Node.js** installed.

### 1. Clone the Repository

```bash
git clone https://github.com/s-n-t09/weberos.git
cd weberos
```

### 2. Install Dependencies

Using npm:

```bash
npm install
```

### 3. Run Development Server

Start the Vite development server:

```bash
npm run dev
```

> The app will be available at `http://localhost:5173`.

### 4. Build for Production

To create an optimized build for deployment:

```bash
npm run build
```

To preview the build locally:

```bash
npm run preview
```

---

## 📱 Included Applications

| App | Icon | Description |
| :--- | :---: | :--- |
| **Explorer** | 📁 | File manager for browsing directories and managing files. |
| **Terminal** | 📟 | Command-line interface for advanced operations. |
| **Coder** | 📝 | Code editor supporting text and `.wbr` files. |
| **Settings** | ⚙️ | System configuration (Wallpaper, Profiles, Weather). |
| **Wire Box** | 🌍📦 | Simple Web browser for the system. |
| **Market** | 🛍️ | App store to discover and install new packages. |
| **WePlayer** | 🎬 | Video and Music player with simple style and timestamp control. |
| **WePic** | 🖼️ | Image viewer for standard image formats. |
| **Snake** | 🐍 | Classic Snake game. |
| **Calco** | 🧮 | Basic arithmetic calculator. |
| **Weather** | ☁️ | Real-time weather updates (requires location access). |

---

## 📂 Project Structure

```text
weberos/
├──  apps/            # Application components (Terminal, Explorer, etc.)
├──  components/      # UI Components (WindowFrame, Taskbar)
├──  utils/           # Helper functions (Filesystem, Constants)
├──  types.ts         # TypeScript definitions
├── index.tsx        # Entry point and Main OS Loop
├── index.html           # HTML entry point
├── package.json         # Project dependencies
└── README.md            # Project documentation
```

---

## 👨‍💻 Developer Guide: Creating Custom Apps

WeberOS supports a unique feature called **Weber Runtime (.wbr)**. You can write simple React components as JSON files to extend the OS functionality without recompiling.

**Create a file named `myapp.wbr`:**

```json
{
  "id": "my-custom-app",
  "name": "My App",
  "icon": "Star",
  "code": "return () => React.createElement('div', {className: 'flex items-center justify-center h-full text-2xl font-bold'}, 'Hello World!')"
}
```

Open this file in **WeberOS Explorer** to install and run it!

---

## 🛡️ API Permissions (v1.7)

In version 1.7, you can request system permissions in your `.wbr` manifest to access advanced features.

| Permission | Description | API Access |
| :--- | :--- | :--- |
| `notifications` | Send system and browser notifications | `Sys.notify(title, message)` |
| `camera` | Access the user's camera | `Sys.requestCamera()` |
| `microphone` | Access the user's microphone | `Sys.requestMic()` |
| `geolocation` | Access real-time location | `Sys.getLocation()` |

**Example with permissions:**
```json
{
  "id": "secure-app",
  "name": "Secure App",
  "icon": "Shield",
  "permissions": ["notifications", "camera"],
  "code": "return () => React.createElement('button', { onClick: () => Sys.notify('Hello', 'Permission granted!') }, 'Notify Me')"
}
```

---

## 📄 License

This project is open-source and available under the **MIT License**.

<br />

<div align="center">
  <sub>Built with precision by <a href="https://github.com/s-n-t09">S.N.T</a></sub>
</div>
