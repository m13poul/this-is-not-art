# Mondrian Audio-Visual Generator

An interactive web application that generates Piet Mondrian-style abstract art synchronized with audio tones.

## Features

- 🎨 Real-time Mondrian-style artwork generation
- 🎵 Synchronized audio tones (single or combination)
- 🎚️ Interactive volume control (0-100%)
- ⏱️ Adjustable generation speed (1-10 seconds)
- 🖼️ Dynamic canvas-based rendering

## Development

### Install Dependencies

```bash
npm install
```

### Run Node.js Mondrian Generator

```bash
npm run start      # Basic generator
npm run start-2    # Advanced generator with CLI options
```

### Web Application

Build the web app:

```bash
npm run build:web
```

Watch for changes:

```bash
npm run watch:web
```

Open `src/web/index.html` in your browser to use the web application.

## Deployment to GitHub Pages

### Deploy Updates

After making changes, rebuild and deploy:

```bash
npm run deploy
```

This command:

1. Builds the web application
2. Copies files to the `docs/` folder
3. Files are ready for GitHub Pages

### Initial GitHub Setup

1. **Create a Private GitHub Repository**

   ```bash
   # On GitHub.com, create a new private repository
   # Then add the remote:
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**

   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select:
     - Branch: `main`
     - Folder: `/docs`
   - Click **Save**

3. **Access Your Site**
   - Your site will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
   - It may take a few minutes for the first deployment

## Project Structure

```
mondrian-generator/
├── docs/              # GitHub Pages deployment folder
│   ├── index.html
│   ├── styles.css
│   └── dist/
│       └── bundle.js
├── src/
│   ├── node/         # Node.js audio implementation
│   ├── web/          # Web application source
│   ├── index.ts      # CLI generator
│   └── index-2.ts    # Advanced CLI generator
├── package.json
└── tsconfig.json
```

## Technologies

- **Frontend**: TypeScript, HTML5 Canvas, Web Audio API
- **Build Tool**: esbuild
- **Backend**: Node.js, TypeScript
- **Libraries**: canvas, play-sound, wav, commander
