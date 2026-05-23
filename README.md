# Compliance.OS Enterprise (AI Ad Compliance Auditor)

An advanced, multimodal AI-powered compliance intelligence system built to protect advertising ecosystems. The system analyzes landing pages and ad creatives against the complex advertising policies of **Meta**, **Google**, **TikTok**, and **Snapchat**.

By crawling landing pages, extracting images and metadata, and performing deep risk intelligence scanning, Compliance.OS acts as an automated trust & safety reviewer, fraud analyst, and compliance auditor simultaneously.

---

## 🚀 Key Features

### 1. Multimodal Content Scanner
- **Deep HTML Parsing**: Scrapes text, links, forms, and metadata.
- **Image Intelligence**: Extracts `<img>` tags, `srcset`, and background images. Uses OCR and multimodal vision (via Gemini) to "see" images and identify misleading visualizations.
- **Link & Redirect Analysis**: Identifies dubious affiliate links, redirect chains, and cloaking indicators.

### 2. Advanced Risk Intelligence Engine
Compliance.OS uses a highly structured, 18-phase analytical framework to determine risk:
- **Business Model Classification**: Designates operations as `WHITE_HAT`, `GREY_HAT`, or `BLACK_HAT`.
- **Product Safety Analysis**: Specifically identifies high-risk verticals (e.g., Crypto, Supplements, MLM, Trading Systems).
- **Threat Detection**: Flags **Dark Patterns** (fake countdowns, manipulative FOMO), **Scam Signals**, and **Policy Evasion Signals**.
- **Platform Enforcement Matrix**: Provides predictive action likelihoods for Meta, Google, TikTok, and Snapchat independently.

### 3. Dynamic Interactive UI
- **Auditor Dashboard**: A sleek, dark-themed React dashboard that visualizes the JSON intelligence payload in real-time.
- **Risk Indicator Badges**: Visually indicates severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- **Interactive Multi-View**: Switch between a raw URL scanner, a sandbox environment for testing ad copy, and a complete final report viewer.

---

## 🛠 Tech Stack

**Frontend Architecture:**
- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS v4 with a custom dark-mode design system
- **Icons & Animation**: Lucide React, Framer Motion

**Backend Architecture:**
- **Server**: Express.js with TypeScript
- **Web Scraping**: Cheerio (for high-speed DOM parsing)
- **AI Orchestration**: Google Gen AI SDK (`@google/genai`)

**Supported AI Providers:**
- **Gemini** (Recommended for Multimodal processing: `gemini-2.5-pro`)
- **Groq** (Fastest inference: `llama-3.3-70b-versatile`)
- **OpenAI** (`gpt-4o`)
- **xAI Grok**
- **OpenRouter** (for any open-source models)

---

## ⚙️ Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**, **yarn**, or **pnpm**
- An API Key from at least one supported AI Provider (e.g., Gemini API Key, Groq API Key).

---

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd ad-compliance-auditor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the root directory based on `.env.example`.
   ```env
   # Select your active AI Provider (gemini, groq, openai, grok, openrouter)
   AI_PROVIDER=gemini

   # Configure the keys for the providers you want to use
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=llama-3.3-70b-versatile
   OPENAI_API_KEY=your_openai_api_key

   APP_URL=http://localhost:3000
   ```
   > **Note:** For the system to properly scan images (Multimodal analysis), you *must* use `AI_PROVIDER=gemini` or an OpenAI vision model. Text-only models like Llama will ignore image analysis.

---

## 💻 Running the Application

### Development Mode
To start the application, run:
```bash
npm run dev
```
This single command uses `tsx` to start the Express backend on `http://localhost:3000` and `vite` to start the Frontend dashboard on `http://localhost:5173`. 

Open your browser and navigate to `http://localhost:5173`.

### Production Build
To build the application for deployment:
```bash
npm run build
```
This compiles the TypeScript backend and creates an optimized Vite production bundle in the `dist` folder.

---

## 📖 How to Use

1. **Choose your Audit Mode**: On the left sidebar, select either **URL Audit** (to scan a live webpage) or **Creative Sandbox** (to paste raw ad copy/text).
2. **Input Target**: Paste the URL (e.g., `https://example.com`) into the browser bar.
3. **Execute**: Click **Run Enterprise Audit**.
4. **Review Results**: 
   - Watch the 15-phase audit execute in real-time.
   - Review the **Business Classification** (White/Grey/Black Hat).
   - Expand the **Platform Enforcement Risk** panel to see how different networks will treat the ad.
   - Investigate the specific **Scam Signals** and **Dark Patterns** isolated by the AI.

---

## 🗂 Project Structure

```text
├── .env                  # Environment configuration
├── package.json          # Dependencies & NPM scripts
├── server.ts             # Express Backend & AI Prompt Orchestration
├── vite.config.ts        # Vite frontend bundler config
└── src/
    ├── App.tsx           # Main React Application shell
    ├── main.tsx          # React DOM entry point
    ├── types.ts          # Global TypeScript interfaces
    ├── data/             # Mock data / JSON database stubs
    └── scanner/          # Core Auditing Dashboard components
        ├── AdScanner.tsx # Scan execution & stream handling
        └── ReportView.tsx# Final compliance report visualizer
```

---

## 🛡 Disclaimer
This tool is intended for compliance officers, media buyers, and ad-platform trust & safety teams. The output generated by the AI is predictive and based on public platform guidelines; it does not constitute legal advice nor does it guarantee actual ad approval or rejection by automated networks.
