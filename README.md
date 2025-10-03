# Multiplayer 3D Game

A real-time multiplayer 3D game built with React, Three.js, Node.js, and Socket.io.

## Features

- **Real-time multiplayer**: Up to multiple players can connect and play simultaneously
- **3D Environment**: Built with Three.js and React Three Fiber
- **Smooth Movement**: Client-side prediction and server reconciliation
- **Cross-platform**: Works on desktop and mobile browsers
- **Low Latency**: Optimized networking with Socket.io

## Tech Stack

### Client
- **React** - UI framework
- **Vite** - Build tool and development server
- **Three.js** - 3D graphics library
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for React Three Fiber
- **Socket.io Client** - Real-time communication

### Server
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **CORS** - Cross-origin resource sharing

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multiplayer
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies
   npm run install:all
   
   # Or install separately
   npm run install:server
   npm run install:client
   ```

### Development

1. **Start the server** (Terminal 1)
   ```bash
   npm run dev:server
   ```
   Server will run on `http://localhost:3001`

2. **Start the client** (Terminal 2)
   ```bash
   npm run dev:client
   ```
   Client will run on `http://localhost:5173`

3. **Open multiple browser tabs** to test multiplayer functionality

### Production Build

1. **Build the client**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Controls

- **WASD** or **Arrow Keys** - Move your player
- **Mouse** - Rotate camera view
- **Scroll** - Zoom in/out

## Game Architecture

### Client-Side
- **Input Handling**: Captures keyboard input and sends to server
- **Rendering**: Three.js scene with player cubes and environment
- **Networking**: Socket.io connection for real-time updates
- **Interpolation**: Smooth movement for remote players

### Server-Side
- **Game Loop**: 60 FPS fixed timestep for consistent simulation
- **Player Management**: Tracks position, velocity, and state
- **Broadcasting**: Sends game state updates to all clients
- **Collision Detection**: Basic boundary checking

### Networking
- **Client Input**: Sent at ~60fps to server
- **Server Updates**: Broadcast at 60fps to all clients
- **Event-Based**: Connection, disconnection, and input events

## Deployment

### Render.com (Recommended)

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Set build command**: `npm run build`
4. **Set start command**: `npm start`
5. **Set environment variables**:
   - `NODE_ENV=production`
   - `PORT=10000` (Render's default)

### Railway

1. **Connect your GitHub repository** to Railway
2. **Set environment variables**:
   - `NODE_ENV=production`
3. **Deploy** - Railway auto-detects the setup

### Heroku

1. **Create a new Heroku app**
2. **Add buildpacks**:
   - `heroku/nodejs`
3. **Set environment variables**:
   - `NODE_ENV=production`
4. **Deploy via Git** or GitHub integration

### Fly.io

1. **Install Fly CLI** and run `fly launch`
2. **Configure fly.toml**:
   ```toml
   [build]
     builder = "heroku/buildpacks:20"
   
   [[services]]
     internal_port = 3001
     protocol = "tcp"
   ```

## Environment Variables

### Server
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

### Client
- `VITE_SERVER_URL` - Socket.io server URL (default: same origin in production)

## Project Structure

```
multiplayer/
├── client/                 # React frontend
│   ├── src/
│   │   ├── MultiplayerGame.tsx  # Main game component
│   │   ├── App.tsx             # App wrapper
│   │   └── main.tsx            # Entry point
│   ├── public/            # Static assets
│   ├── .env               # Development environment
│   ├── .env.production    # Production environment
│   └── package.json       # Client dependencies
├── server/                # Node.js backend
│   ├── index.js          # Server entry point
│   └── package.json      # Server dependencies
├── package.json          # Root scripts
└── README.md            # This file
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if server is running on port 3001
   - Verify CORS settings match client URL
   - Check firewall settings

2. **Players Not Moving**
   - Check browser console for JavaScript errors
   - Verify WebSocket connection in Network tab
   - Test with keyboard focus on game area

3. **Performance Issues**
   - Reduce number of players
   - Check browser hardware acceleration
   - Monitor network latency

### Development Tips

- Use browser dev tools to monitor WebSocket traffic
- Check server logs for connection issues
- Test with multiple browser tabs for multiplayer simulation

## Future Enhancements

- [ ] Physics integration (Rapier.js/Cannon.js)
- [ ] Player authentication
- [ ] Game rooms/lobbies
- [ ] Mobile touch controls
- [ ] Audio integration
- [ ] Player avatars/models
- [ ] Game objectives/scoring
- [ ] Anti-cheat measures
- [ ] Binary message protocols
- [ ] WebRTC data channels for ultra-low latency

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for learning or building your own games!