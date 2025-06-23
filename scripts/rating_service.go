package main

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"os"
	"sort"
	"strings"
)

// PlayerAttributes represents player attributes
type PlayerAttributes struct {
	Pace      int `json:"pace"`
	Shooting  int `json:"shooting"`
	Passing   int `json:"passing"`
	Dribbling int `json:"dribbling"`
	Defending int `json:"defending"`
	Physical  int `json:"physical"`
}

// Player represents a player
type Player struct {
	ID                string         `json:"id"`
	Name              string         `json:"name"`
	ShortName         string         `json:"shortName"`
	Age               int            `json:"age"`
	Nationality       string         `json:"nationality"`
	FifaCode          string         `json:"fifaCode"`
	MainPosition      string         `json:"mainPosition"`
	AlternatePositions []string      `json:"alternatePositions"`
	Role              string         `json:"role"`
	Attributes        PlayerAttributes `json:"attributes"`
	Overall           int            `json:"overall"`
	Potential         int            `json:"potential"`
	PreferredFoot     string         `json:"preferred_foot"`
	Stats             map[string]int `json:"stats"`
}

// PositionPriority represents position priorities
type PositionPriority struct {
	Position   string   `json:"position"`
	Priorities []string `json:"priorities"`
}

// PositionCount represents position count
type PositionCount struct {
	Position string `json:"position"`
	Count    int    `json:"count"`
}

// PlayerRating represents a player rating
type PlayerRating struct {
	Player   Player  `json:"player"`
	Rating   float64 `json:"rating"`
	Position string  `json:"position"`
}

// TeamAnalysis represents team analysis
type TeamAnalysis struct {
	BestXI           []PlayerRating         `json:"bestXI"`
	Bench            []PlayerRating         `json:"bench"`
	Aging            []Player               `json:"aging"`
	Veterans         []Player               `json:"veterans"`
	YoungStars       []Player               `json:"youngStars"`
	PositionStrengths map[string]map[string]interface{} `json:"positionStrengths"`
	SectorStrengths  map[string]map[string]interface{} `json:"sectorStrengths"`
}

// InputData represents input data
type InputData struct {
	Players            []Player           `json:"players"`
	PositionCounts     []PositionCount    `json:"positionCounts"`
	PositionPriorities []PositionPriority `json:"positionPriorities"`
	ToggledPositions   []string           `json:"toggledPositions"`
}

// Constants (same as frontend)
var roleWeights = map[string]float64{
	"C": 1.0, // Crucial
	"I": 0.8, // Important
	"R": 0.6, // Rotation
	"S": 0.4, // Squad
	"P": 0.2, // Prospect
}

var sectors = map[string][]string{
	"Defense":    {"LB", "CB", "RB"},
	"Midfield":   {"CDM", "CM", "CAM", "LM", "RM"},
	"Forward":    {"LW", "RW", "ST"},
	"Goalkeeper": {"GK"},
}

var togglePositions = []string{"RWB", "RB", "RW", "LWB", "LB", "LW"}

// calculatePlayerRating calculates player rating using the same logic as frontend
func calculatePlayerRating(player Player, position string, positionPriorities []PositionPriority, toggledPositions []string) float64 {
	var positionPriority *PositionPriority
	for i := range positionPriorities {
		if positionPriorities[i].Position == position {
			positionPriority = &positionPriorities[i]
			break
		}
	}

	rating := 0.0

	// Base rating from overall (30%)
	rating += float64(player.Overall) * 0.3

	// Attribute rating based on position priorities (40%)
	if positionPriority != nil && len(positionPriority.Priorities) > 0 {
		priorities := positionPriority.Priorities
		attributeWeights := make(map[string]float64)

		// Calculate attribute weights
		for i, attr := range priorities {
			attributeWeights[strings.ToLower(attr)] = 1.0 - float64(i)*0.2 // 1.0, 0.8, 0.6 for top 3
		}

		// Calculate weighted attribute score
		attributes := map[string]int{
			"pace":      player.Attributes.Pace,
			"shooting":  player.Attributes.Shooting,
			"passing":   player.Attributes.Passing,
			"dribbling": player.Attributes.Dribbling,
			"defending": player.Attributes.Defending,
			"physical":  player.Attributes.Physical,
		}

		weightedSum := 0.0
		for attr, value := range attributes {
			weight := attributeWeights[attr]
			if weight == 0 {
				weight = 0.2 // Default weight for non-prioritized attributes
			}
			weightedSum += float64(value) * weight
		}

		attributeScore := weightedSum / float64(len(attributes))
		rating += attributeScore * 0.4
	} else {
		// If no priorities set, use average of all attributes
		attributes := []int{
			player.Attributes.Pace,
			player.Attributes.Shooting,
			player.Attributes.Passing,
			player.Attributes.Dribbling,
			player.Attributes.Defending,
			player.Attributes.Physical,
		}

		sum := 0
		for _, attr := range attributes {
			sum += attr
		}
		avgAttribute := float64(sum) / float64(len(attributes))
		rating += avgAttribute * 0.4
	}

	// Age rating (15%)
	ageDiff := math.Abs(float64(player.Age - 25))
	ageRating := math.Max(0.0, 1.0-ageDiff*0.05)
	rating += ageRating * 0.15

	// Role rating (15%)
	roleWeight := roleWeights[player.Role]
	if roleWeight == 0 {
		roleWeight = 0.2
	}
	rating += roleWeight * 0.15

	// Potential boost - slight boost for higher potential
	potentialBoost := float64(player.Potential-player.Overall) * 0.02
	rating += math.Max(0.0, potentialBoost)

	// Foot preference boost for wing positions
	if contains(togglePositions, position) {
		isInverted := contains(toggledPositions, position)
		isRightWing := contains([]string{"RB", "RWB", "RW"}, position)
		isRightFooted := player.PreferredFoot == "Right"

		// If inverted is off, boost same foot. If inverted is on, boost opposite foot
		if (isRightWing && isRightFooted && !isInverted) ||
			(isRightWing && !isRightFooted && isInverted) ||
			(!isRightWing && !isRightFooted && !isInverted) ||
			(!isRightWing && isRightFooted && isInverted) {
			rating += 0.5 // Small boost of 0.5 points
		}
	}

	return rating
}

// calculateGKRating calculates goalkeeper rating using the same logic as frontend
func calculateGKRating(player Player) float64 {
	rating := 0.0

	// Base rating from overall (50%)
	rating += float64(player.Overall) * 0.5

	// Age rating (25%)
	ageDiff := math.Abs(float64(player.Age - 25))
	ageRating := math.Max(0.0, 1.0-ageDiff*0.05)
	rating += ageRating * 0.25

	// Role rating (25%)
	roleWeight := roleWeights[player.Role]
	if roleWeight == 0 {
		roleWeight = 0.2
	}
	rating += roleWeight * 0.25

	// Potential boost - slight boost for higher potential
	potentialBoost := float64(player.Potential-player.Overall) * 0.02
	rating += math.Max(0.0, potentialBoost)

	return rating
}

// contains checks if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// calculateStats calculates team statistics
func calculateStats(players []Player) (float64, float64, float64) {
	if len(players) == 0 {
		return 0, 0, 0
	}

	sumAge := 0
	sumOverall := 0
	for _, p := range players {
		sumAge += p.Age
		sumOverall += p.Overall
	}

	avgAge := float64(sumAge) / float64(len(players))
	avgOverall := float64(sumOverall) / float64(len(players))

	// Calculate standard deviation
	sumSquaredDiff := 0.0
	for _, p := range players {
		diff := float64(p.Age) - avgAge
		sumSquaredDiff += diff * diff
	}
	ageStdDev := math.Sqrt(sumSquaredDiff / float64(len(players)))

	return avgAge, avgOverall, ageStdDev
}

// analyzeTeam analyzes team using the same logic as frontend but with optimized calculations
func analyzeTeam(players []Player, positionCounts []PositionCount, positionPriorities []PositionPriority, toggledPositions []string) TeamAnalysis {
	if len(players) == 0 {
		return TeamAnalysis{
			BestXI:           []PlayerRating{},
			Bench:            []PlayerRating{},
			Aging:            []Player{},
			Veterans:         []Player{},
			YoungStars:       []Player{},
			PositionStrengths: make(map[string]map[string]interface{}),
			SectorStrengths:  make(map[string]map[string]interface{}),
		}
	}

	// Calculate statistics
	avgAge, avgOverall, ageStdDev := calculateStats(players)

	// Rate players for each position
	var playerRatings []PlayerRating

	// Only rate players for positions that are configured in tactics
	var tacticsPositions []string
	for _, pc := range positionCounts {
		if pc.Count > 0 {
			tacticsPositions = append(tacticsPositions, pc.Position)
		}
	}

	// Always include GK if there are GK players
	var positionsToRate []string
	hasGK := false
	for _, p := range players {
		if p.MainPosition == "GK" {
			hasGK = true
			break
		}
	}

	if hasGK {
		positionsToRate = append([]string{"GK"}, tacticsPositions...)
	} else {
		positionsToRate = tacticsPositions
	}

	for _, position := range positionsToRate {
		for _, player := range players {
			if player.MainPosition == position {
				var rating float64
				if position == "GK" {
					rating = calculateGKRating(player)
				} else {
					rating = calculatePlayerRating(player, position, positionPriorities, toggledPositions)
				}
				playerRatings = append(playerRatings, PlayerRating{
					Player:   player,
					Rating:   rating,
					Position: position,
				})
			}
		}
	}

	// Sort by rating and select best XI
	sort.Slice(playerRatings, func(i, j int) bool {
		return playerRatings[i].Rating > playerRatings[j].Rating
	})

	var bestXI []PlayerRating
	usedPositions := make(map[string]bool)

	// Select best player for each position
	for _, rating := range playerRatings {
		if len(bestXI) < 11 && !usedPositions[rating.Position] {
			bestXI = append(bestXI, rating)
			usedPositions[rating.Position] = true
		}
	}

	// Select bench players (remaining top players)
	var bench []PlayerRating
	bestXIIds := make(map[string]bool)
	for _, xi := range bestXI {
		bestXIIds[xi.Player.ID] = true
	}

	for _, rating := range playerRatings {
		if !bestXIIds[rating.Player.ID] && len(bench) < 7 {
			bench = append(bench, rating)
		}
	}

	// Categorize players
	var aging, veterans, youngStars []Player
	for _, p := range players {
		if p.Age > int(avgAge+ageStdDev) {
			aging = append(aging, p)
		}
		if p.Age > 30 && p.Overall > int(avgOverall) {
			veterans = append(veterans, p)
		}
		if p.Age < int(avgAge-ageStdDev) && p.Overall > int(avgOverall) {
			youngStars = append(youngStars, p)
		}
	}

	// Analyze position strengths
	positionStrengths := make(map[string]map[string]interface{})
	var configuredPositions []string
	for _, pc := range positionCounts {
		if pc.Count > 0 {
			configuredPositions = append(configuredPositions, pc.Position)
		}
	}

	for _, position := range configuredPositions {
		var positionPlayers []Player
		for _, p := range players {
			if p.MainPosition == position {
				positionPlayers = append(positionPlayers, p)
			}
		}

		count := len(positionPlayers)
		hasProspect := false
		hasVeteran := false
		hasNormal := false
		hasAging := false

		for _, p := range positionPlayers {
			if p.Age < int(avgAge-ageStdDev) {
				hasProspect = true
			}
			if p.Age > 30 {
				hasVeteran = true
			}
			if p.Age >= int(avgAge-ageStdDev) && p.Age <= int(avgAge+ageStdDev) {
				hasNormal = true
			}
			if p.Age > int(avgAge+ageStdDev) {
				hasAging = true
			}
		}

		var message interface{}
		if count == 0 {
			message = fmt.Sprintf("No players at %s", position)
		} else if count < 2 {
			message = fmt.Sprintf("Need more players at %s", position)
		} else if !hasProspect {
			message = fmt.Sprintf("Need %s prospects", position)
		}

		positionStrengths[position] = map[string]interface{}{
			"hasProspect": hasProspect,
			"hasVeteran":  hasVeteran,
			"hasNormal":   hasNormal,
			"hasAging":    hasAging,
			"count":       count,
			"message":     message,
		}
	}

	// Analyze sector strengths
	sectorStrengths := make(map[string]map[string]interface{})
	for sector, positions := range sectors {
		var sectorPlayers []Player
		for _, p := range players {
			if contains(positions, p.MainPosition) {
				sectorPlayers = append(sectorPlayers, p)
			}
		}

		count := len(sectorPlayers)
		var message interface{}
		if count < 3 {
			message = fmt.Sprintf("Weak %s depth", sector)
		} else if count > 8 {
			message = fmt.Sprintf("Strong %s depth", sector)
		}

		sectorStrengths[sector] = map[string]interface{}{
			"count":   count,
			"message": message,
		}
	}

	return TeamAnalysis{
		BestXI:           bestXI,
		Bench:            bench,
		Aging:            aging,
		Veterans:         veterans,
		YoungStars:       youngStars,
		PositionStrengths: positionStrengths,
		SectorStrengths:  sectorStrengths,
	}
}

func main() {
	// Read input from stdin
	inputBytes, err := io.ReadAll(os.Stdin)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading input: %v\n", err)
		os.Exit(1)
	}

	var inputData InputData
	if err := json.Unmarshal(inputBytes, &inputData); err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing input: %v\n", err)
		os.Exit(1)
	}

	// Analyze team
	analysis := analyzeTeam(inputData.Players, inputData.PositionCounts, inputData.PositionPriorities, inputData.ToggledPositions)

	// Output result to stdout
	outputBytes, err := json.Marshal(analysis)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshaling output: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(string(outputBytes))
} 