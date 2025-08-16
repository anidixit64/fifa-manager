# FIFA Manager

A comprehensive football team management application built with Next.js, TypeScript, and Tailwind CSS. Create teams, manage players, analyze tactics, and build your dream squad with advanced statistics and Best XI analysis.

🌐 **Live Demo**: [https://fifa-manager-rtib.vercel.app](https://fifa-manager-rtib.vercel.app)

## 🚀 Features

### Team Management
- **Create Custom Teams**: Build your own football team with custom logos and themes
- **Team Selection**: Choose from a database of real football teams with autocomplete suggestions
- **Team Theming**: Automatic color extraction from team logos for consistent branding
- **Team Switching**: Easily switch between different teams

### Player Management
- **Player Database**: Access to a comprehensive database of real football players
- **Player Creation**: Add custom players with detailed attributes
- **Player Statistics**: Track goals, assists, and performance metrics
- **Advanced Player Stats**: Monitor red cards, shots, shots on target, and true shooting percentage
- **Player Potential**: Advanced scoring system that considers player potential for Best XI selection
- **Attribute System**: Manage pace, shooting, passing, dribbling, defending, and physical attributes
- **Interactive Navigation**: Click on any player in Best XI to view their detailed statistics

### Tactical Analysis
- **Formation Editor**: Configure custom formations with position-specific player counts
- **Position Priorities**: Set attribute priorities for each position (e.g., pace for wingers, defending for center-backs)
- **Tactical Flexibility**: Support for inverted wingers and position-specific tactics
- **Formation Presets**: Quick setup with popular formations (4-3-3, 4-4-2, 3-5-2)

### Best XI Analysis
- **Intelligent Selection**: Advanced algorithm that considers:
  - Player overall rating
  - Position-specific attribute priorities
  - Age and experience factors
  - Player potential for future development
  - Role importance (Crucial, Important, Rotation, Squad, Prospect)
  - Preferred foot for wing positions
  - **Advanced Metrics**: Red cards (penalty), shooting efficiency, and true shooting percentage
- **Bench Selection**: Automatic selection of substitute players
- **Team Analysis**: Comprehensive breakdown of team strengths and weaknesses
- **Position Analysis**: Detailed analysis of each position's depth and quality
- **Interactive Player Cards**: Click any player to navigate to their detailed statistics

### Statistics & Analytics
- **Player Performance**: Track individual player statistics and performance scores
- **Advanced Statistics**: Monitor red cards, shots, shots on target, and true shooting percentage
- **Team Statistics**: Overall team ratings, average age, and squad size
- **Position-based Scoring**: Weighted scoring system based on position requirements
- **Sector Analysis**: Defense, midfield, and forward line strength assessment
- **Shooting Efficiency**: True shooting percentage calculation for attacking players

### Performance & User Experience
- **Optimized Navigation**: Fast, responsive page transitions with reduced loading times
- **Smooth Animations**: Enhanced hover effects and interactive feedback
- **Mobile-First Design**: Responsive layouts optimized for all devices
- **Real-time Updates**: Instant feedback when modifying player statistics

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.3.3**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Hooks**: State management and side effects

### Data Management
- **Local Storage**: Persistent data storage for teams and players
- **JSON Data**: Real football data from FIFA database
- **Custom Hooks**: Reusable logic for data management

### Styling & UI
- **Custom Color Scheme**: Forest green (#3c5c34), light gray (#dde1e0), and accent colors
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Smooth Animations**: CSS transitions and custom animations
- **Modern UI**: Clean, professional interface with soccer-themed elements

### Deployment
- **Vercel**: Production deployment and hosting
- **GitHub**: Version control and CI/CD

## 📁 Project Structure

```
fifa-manager/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── best-xi/           # Best XI analysis page
│   │   ├── create-team/       # Team creation page
│   │   ├── edit-tactics/      # Tactics configuration
│   │   ├── manager/           # Main dashboard
│   │   ├── player-stats/      # Player statistics
│   │   └── page.tsx           # Landing page
│   ├── components/            # Reusable React components
│   │   ├── BestXI.tsx         # Best XI display component
│   │   ├── PlayerForm.tsx     # Player creation/editing form
│   │   ├── PlayerList.tsx     # Player list with sorting
│   │   ├── TeamForm.tsx       # Team creation form
│   │   └── TeamStats.tsx      # Team statistics display
│   ├── contexts/              # React contexts
│   │   └── TeamThemeContext.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── useLocalStorage.ts
│   │   └── useTeamThemeStyles.ts
│   ├── types/                 # TypeScript type definitions
│   │   └── player.ts
│   └── utils/                 # Utility functions
│       └── colorUtils.ts
├── public/
│   ├── data/                  # JSON data files
│   │   ├── countries.json
│   │   ├── players.json
│   │   └── teams.json
│   └── images/                # Static images
└── package.json
```

## 🎮 How to Use

### Getting Started
1. Visit [https://fifa-manager-rtib.vercel.app](https://fifa-manager-rtib.vercel.app)
2. Click "START MANAGING" to begin
3. Create or select a team from the available options
4. Start building your squad by adding players

### Creating a Team
1. Navigate to the Create Team page
2. Enter a team name (with autocomplete suggestions)
3. Optionally upload a team logo
4. Click on your team card to proceed to management

### Adding Players
1. In the Manager Dashboard, click "Add Player"
2. Enter player details or search from the database
3. Set player attributes and statistics
4. Configure advanced stats (red cards, shots, shots on target)
5. Save the player to your squad

### Configuring Tactics
1. Go to "Edit Tactics" from the Manager Dashboard
2. Set the number of players for each position
3. Configure position-specific attribute priorities
4. Save your tactical configuration

### Analyzing Best XI
1. Ensure you have exactly 10 players configured in tactics
2. Click "Analyze Team" from the Manager Dashboard
3. View your optimal starting lineup and bench
4. Click on any player card to view their detailed statistics
5. Review detailed analysis of team strengths

### Advanced Player Statistics
1. Navigate to the Player Stats page
2. Expand the "Advanced Stats" dropdown for detailed metrics
3. View red cards, shots, shots on target, and true shooting percentage
4. All advanced stats factor into the player's overall score
5. Use the two-column layout for efficient data entry

## 🔧 Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/anidixit64/fifa-manager.git

# Navigate to project directory
cd fifa-manager

# Install dependencies
npm install

# Run development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Setup
The application uses local storage for data persistence, so no additional environment variables are required for basic functionality.

## 📊 Data Sources

- **Players Database**: Comprehensive FIFA player database with real player statistics
- **Teams Database**: Real football teams with official names and data
- **Countries Database**: FIFA country codes and national team information

## 🎨 Design Philosophy

The application follows a modern, clean design philosophy with:
- **Soccer-themed aesthetics**: Green color scheme reminiscent of football fields
- **Intuitive navigation**: Clear, logical flow between different sections
- **Responsive design**: Works seamlessly on desktop and mobile devices
- **Performance focus**: Optimized for fast loading and smooth interactions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- FIFA for the comprehensive player and team data
- Next.js team for the excellent framework
- Vercel for seamless deployment and hosting
- The football community for inspiration and feedback

---

**Ready to build your dream team?** Visit [https://fifa-manager-rtib.vercel.app](https://fifa-manager-rtib.vercel.app) and start managing! ⚽
