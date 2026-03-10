# DRMIS User Manual

This folder contains the **DRMIS User Manual** for end users.

## Building the Manual

### Prerequisites

- [Quarto](https://quarto.org/docs/get-started/) (recommended: v1.4+)

Install Quarto:

```bash
# macOS (Homebrew)
brew install quarto

# Ubuntu/Debian
sudo apt-get install quarto

# Or download from https://quarto.org/docs/get-started/
```

### Render to HTML

From the project root:

```bash
quarto render docs/user-manual.qmd
```

This produces `docs/user-manual.html`, a **self-contained** HTML file (all CSS/JS embedded). You can share this single file or host it on a web server.

### Alternative: Render from docs folder

```bash
cd docs
quarto render user-manual.qmd
```

## Screenshots

Screenshots are stored in `docs/screenshots/`:

| File | Description |
|------|-------------|
| `01-login_.png` | Login screen |
| `02-dashboard_.png` | Main dashboard with map |
| `03-left-sidebar_.png` | Data layers sidebar |
| `04-right-sidebar_.png` | Context panel with filters |
| `05-expanded-full width-right-sidebar_.png` | Right sidebar expanded full width |
| `06-download-dialog_.png` | Download dialog |

To use **actual screenshots** from your system:

1. Run the application and capture screenshots.
2. Save them with the same filenames in `docs/screenshots/`.
3. Re-run `quarto render docs/user-manual.qmd`.
