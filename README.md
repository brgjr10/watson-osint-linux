# Watson

<img width="1280" height="640" alt="image" src="https://github.com/user-attachments/assets/58e48262-e10c-45ba-8a91-2a9624575e91" />

Free OSINT tool for Linux — people search across public sites by nickname, email, phone, or website.

<img width="960" height="600" alt="image" src="https://github.com/user-attachments/assets/ccad90c2-6794-49b0-aed8-91078d72d8e0" />

## Features

- **Multi-type search**: Automatically detects and searches by username, email, phone number, domain, or company
- **Real lookups**: Integrated with [Maigret](https://github.com/soxoj/maigret) (username enumeration) and [Holehe](https://github.com/megadose/holehe) (email account discovery)
- **Results visualization**: Clean interface showing found profiles grouped by category (Social, Dev, Gaming, Forums, Media)
- **Search history**: Locally saved search history on your device
- **Sources panel**: View connected and available OSINT sources
- **Dark UI**: Modern dark-themed interface built with React and Tailwind CSS

<img width="960" height="600" alt="image" src="https://github.com/user-attachments/assets/7244c902-caab-4cdd-b966-95401d1e866a" />

<img width="1280" height="800" alt="image" src="https://github.com/user-attachments/assets/ca8cdc7b-7b30-4575-b63a-be595db2532d" />

<img width="1280" height="800" alt="image" src="https://github.com/user-attachments/assets/337e556f-bd69-487c-83e3-a4393ec19777" />

## Tech Stack

- [Electron](https://www.electronjs.org/) 45
- [Vite](https://vitejs.dev/) 8
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/) 7
- [Tailwind CSS](https://tailwindcss.com/) 4

## Installation

### AppImage (Recommended)

Download the latest AppImage from [Releases](https://github.com/brgjr10/watson-osint-linux/releases).

```bash
chmod +x Watson-*.AppImage
./Watson-*.AppImage
```

### Build from Source

```bash
# Install dependencies
npm install

# Build
npm run build

# Run
npm run app
```

## Requirements

For real lookups, install the following tools:

```bash
pipx install maigret holehe
# or
pip install maigret holehe
```

Make sure `maigret` and `holehe` are in your PATH.

## Usage

1. Launch Watson
2. Enter a nickname, email, phone number, or website
3. View results as they're discovered
4. Browse your search history from the History page

## Privacy

- No account required
- No tracking
- Search history is saved only locally on your computer
- Only searches publicly available information

## License

See [LICENSE](LICENSE) for details.
