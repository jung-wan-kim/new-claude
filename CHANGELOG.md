# Changelog

All notable changes to Claude Code Controller will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-06-19

### Added
- Initial release of Claude Code Controller
- Terminal-based UI with Blessed/Ink components
- TaskManager MCP integration for intelligent task management
- Context7 MCP integration for context persistence
- macOS native app with Electron
- System tray integration
- Dark/Light/High-contrast themes
- Vi-mode keyboard shortcuts
- Real-time task status updates
- Claude Code CLI integration
- Terminal emulation with xterm.js

### Features
- **Task Management**
  - Create and manage task requests
  - Track task progress in real-time
  - Automatic task approval workflow
  
- **Context Management**
  - Save and search contexts
  - Tag-based organization
  - Metadata support
  
- **UI/UX**
  - Split-panel layout (Tasks, Work, Context, Logs)
  - Keyboard-driven navigation
  - Customizable themes
  - Responsive layout modes

### Technical
- TypeScript + React architecture
- Zustand state management
- Electron IPC communication
- MCP SDK integration
- Vite build system

### Known Issues
- MCP servers require manual API key configuration
- Limited to macOS platform in this release

---

## Roadmap

### [0.2.0] - Planned
- Windows and Linux support
- Plugin system for custom MCP servers
- Enhanced workflow automation
- Multi-language support

### [0.3.0] - Planned
- Cloud sync for contexts
- Team collaboration features
- Advanced analytics dashboard