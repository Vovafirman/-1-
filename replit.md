# Киношлеп Кликер (Film Clicker Game)

## Overview

This is a Russian-language incremental clicker game themed around building a movie empire. Players click to earn money, purchase upgrades, unlock achievements, and build their film production business. The game features a web-based interface with persistent save data and multiple gameplay mechanics including passive income, upgrades, and achievements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a traditional client-server web architecture:

### Frontend Architecture
- **Technology**: Pure HTML/CSS/JavaScript (no frontend frameworks)
- **Structure**: Single-page application with tab-based navigation
- **Styling**: CSS with custom properties for theming, Google Fonts integration
- **Interactivity**: Vanilla JavaScript for game logic and DOM manipulation

### Backend Architecture
- **Framework**: Flask (Python web framework)
- **Session Management**: Flask sessions with configurable secret key
- **File Structure**: Simple Python module with route handlers and utility functions

## Key Components

### 1. Game Engine (`static/js/game.js`)
- **Game State Management**: Central `gameState` object tracking all player progress
- **Upgrade System**: Multiple upgrade types with exponential cost scaling
- **Achievement System**: Progress-based unlockables
- **Save/Load System**: JSON-based persistence

### 2. Flask Backend (`app.py`)
- **Route Handlers**: Serves templates and handles API requests
- **Session Management**: Per-session save file isolation
- **Data Persistence**: JSON file-based storage in `saves/` directory
- **Configuration**: Environment-based secret key management

### 3. User Interface
- **Template System**: Jinja2 templates with server-side data injection
- **Responsive Design**: Mobile-optimized with viewport meta tags
- **Visual Effects**: CSS animations and gradients for engaging experience
- **Tab Navigation**: Multi-section interface (Films, Upgrades, Achievements, Shop, Settings, Stats)

### 4. Data Layer
- **Storage Format**: JSON files for game saves
- **Session Isolation**: Individual save files per session ID
- **Default Data Structure**: Comprehensive game state with nested objects for upgrades and achievements

## Data Flow

1. **Game Initialization**: Flask loads saved data and injects into template
2. **Client Interaction**: JavaScript handles all user interactions locally
3. **Auto-Save**: Periodic saves to server via AJAX (implied by structure)
4. **Session Management**: Flask maintains session state for save file isolation

## External Dependencies

### Frontend Dependencies
- **Google Fonts**: Montserrat font family for typography
- **No JavaScript Frameworks**: Pure vanilla JS implementation

### Backend Dependencies
- **Flask**: Web framework and templating
- **Python Standard Library**: JSON, logging, datetime, os modules

### Development Dependencies
- **Environment Variables**: `SESSION_SECRET` for session security

## Deployment Strategy

### File Structure
- **Static Assets**: CSS and JavaScript served from `static/` directory
- **Templates**: HTML templates in `templates/` directory
- **Save Data**: JSON files stored in `saves/` directory
- **Configuration**: Environment variable-based configuration

### Production Considerations
- **Session Security**: Configurable secret key via environment
- **Data Persistence**: File-based storage (suitable for single-instance deployment)
- **Logging**: Built-in Python logging for debugging
- **Error Handling**: Basic Flask error handling

### Scalability Notes
- **Current Architecture**: Single-instance file-based storage
- **Future Considerations**: Could be enhanced with database storage for multi-instance deployment
- **Session Management**: Currently file-based, could be moved to Redis or database

The application is designed as a self-contained web game with minimal external dependencies, making it suitable for simple hosting environments while maintaining good separation of concerns between frontend game logic and backend data persistence.