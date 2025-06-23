#!/usr/bin/env python3
"""
Advanced Player Rating Calculator
Uses the same metrics as the frontend but with more efficient mathematical operations
"""

import json
import sys
import math
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import numpy as np

@dataclass
class PlayerAttributes:
    pace: int
    shooting: int
    passing: int
    dribbling: int
    defending: int
    physical: int

@dataclass
class Player:
    id: str
    name: str
    shortName: str
    age: int
    nationality: str
    fifaCode: str
    mainPosition: str
    alternatePositions: List[str]
    role: str
    attributes: PlayerAttributes
    overall: int
    potential: int
    preferred_foot: str
    stats: Dict[str, int]

@dataclass
class PositionPriority:
    position: str
    priorities: List[str]

@dataclass
class PositionCount:
    position: str
    count: int

@dataclass
class PlayerRating:
    player: Player
    rating: float
    position: str

@dataclass
class TeamAnalysis:
    bestXI: List[PlayerRating]
    bench: List[PlayerRating]
    aging: List[Player]
    veterans: List[Player]
    youngStars: List[Player]
    positionStrengths: Dict[str, Dict[str, Any]]
    sectorStrengths: Dict[str, Dict[str, Any]]

# Constants (same as frontend)
ROLE_WEIGHTS = {
    'C': 1.0,  # Crucial
    'I': 0.8,  # Important
    'R': 0.6,  # Rotation
    'S': 0.4,  # Squad
    'P': 0.2   # Prospect
}

SECTORS = {
    'Defense': ['LB', 'CB', 'RB'],
    'Midfield': ['CDM', 'CM', 'CAM', 'LM', 'RM'],
    'Forward': ['LW', 'RW', 'ST'],
    'Goalkeeper': ['GK']
}

TOGGLE_POSITIONS = ['RWB', 'RB', 'RW', 'LWB', 'LB', 'LW']

def calculate_player_rating(
    player: Player, 
    position: str, 
    position_priorities: List[PositionPriority], 
    toggled_positions: List[str]
) -> float:
    """Calculate player rating using the same logic as frontend but with optimized math"""
    
    position_priority = next((pp for pp in position_priorities if pp.position == position), None)
    rating = 0.0

    # Base rating from overall (30%)
    rating += player.overall * 0.3

    # Attribute rating based on position priorities (40%)
    if position_priority and position_priority.priorities:
        priorities = position_priority.priorities
        # Use numpy for efficient array operations
        attribute_weights = {}
        for i, attr in enumerate(priorities):
            attribute_weights[attr.lower()] = 1.0 - (i * 0.2)  # 1.0, 0.8, 0.6 for top 3

        # Calculate weighted attribute score using numpy
        attributes_dict = {
            'pace': player.attributes.pace,
            'shooting': player.attributes.shooting,
            'passing': player.attributes.passing,
            'dribbling': player.attributes.dribbling,
            'defending': player.attributes.defending,
            'physical': player.attributes.physical
        }
        
        weighted_sum = 0.0
        total_weight = 0.0
        
        for attr, value in attributes_dict.items():
            weight = attribute_weights.get(attr, 0.2)  # Default weight for non-prioritized attributes
            weighted_sum += value * weight
            total_weight += weight
        
        attribute_score = weighted_sum / len(attributes_dict) if attributes_dict else 0.0
        rating += attribute_score * 0.4
    else:
        # If no priorities set, use average of all attributes
        attributes = [
            player.attributes.pace,
            player.attributes.shooting,
            player.attributes.passing,
            player.attributes.dribbling,
            player.attributes.defending,
            player.attributes.physical
        ]
        avg_attribute = np.mean(attributes)
        rating += avg_attribute * 0.4

    # Age rating (15%) - using optimized math
    age_diff = abs(player.age - 25)
    age_rating = max(0.0, 1.0 - (age_diff * 0.05))
    rating += age_rating * 0.15

    # Role rating (15%)
    role_weight = ROLE_WEIGHTS.get(player.role, 0.2)
    rating += role_weight * 0.15

    # Potential boost - slight boost for higher potential
    potential_boost = (player.potential - player.overall) * 0.02
    rating += max(0.0, potential_boost)

    # Foot preference boost for wing positions
    if position in TOGGLE_POSITIONS:
        is_inverted = position in toggled_positions
        is_right_wing = position in ['RB', 'RWB', 'RW']
        is_right_footed = player.preferred_foot == 'Right'
        
        # If inverted is off, boost same foot. If inverted is on, boost opposite foot
        if ((is_right_wing and is_right_footed and not is_inverted) or 
            (is_right_wing and not is_right_footed and is_inverted) or
            (not is_right_wing and not is_right_footed and not is_inverted) or
            (not is_right_wing and is_right_footed and is_inverted)):
            rating += 0.5  # Small boost of 0.5 points

    return rating

def calculate_gk_rating(player: Player) -> float:
    """Calculate goalkeeper rating using the same logic as frontend"""
    
    rating = 0.0

    # Base rating from overall (50%)
    rating += player.overall * 0.5

    # Age rating (25%)
    age_diff = abs(player.age - 25)
    age_rating = max(0.0, 1.0 - (age_diff * 0.05))
    rating += age_rating * 0.25

    # Role rating (25%)
    role_weight = ROLE_WEIGHTS.get(player.role, 0.2)
    rating += role_weight * 0.25

    # Potential boost - slight boost for higher potential
    potential_boost = (player.potential - player.overall) * 0.02
    rating += max(0.0, potential_boost)

    return rating

def analyze_team(
    players: List[Player],
    position_counts: List[PositionCount],
    position_priorities: List[PositionPriority],
    toggled_positions: List[str]
) -> TeamAnalysis:
    """Analyze team using the same logic as frontend but with optimized calculations"""
    
    if not players:
        return TeamAnalysis([], [], [], [], [], {}, {})

    # Calculate statistics using numpy for efficiency
    ages = np.array([p.age for p in players])
    overalls = np.array([p.overall for p in players])
    
    avg_age = np.mean(ages)
    avg_overall = np.mean(overalls)
    age_std_dev = np.std(ages)

    # Rate players for each position
    player_ratings = []
    
    # Only rate players for positions that are configured in tactics
    tactics_positions = [pc.position for pc in position_counts if pc.count > 0]
    
    # Always include GK if there are GK players
    positions_to_rate = ['GK'] + tactics_positions if any(p.mainPosition == 'GK' for p in players) else tactics_positions
    
    for position in positions_to_rate:
        for player in players:
            if player.mainPosition == position:
                rating = (calculate_gk_rating(player) if position == 'GK' 
                         else calculate_player_rating(player, position, position_priorities, toggled_positions))
                player_ratings.append(PlayerRating(player, rating, position))

    # Sort by rating and select best XI
    sorted_ratings = sorted(player_ratings, key=lambda x: x.rating, reverse=True)
    best_xi = []
    used_positions = set()

    # Select best player for each position
    for rating in sorted_ratings:
        if len(best_xi) < 11 and rating.position not in used_positions:
            best_xi.append(rating)
            used_positions.add(rating.position)

    # Select bench players (remaining top players)
    bench = [r for r in sorted_ratings if r.player.id not in [xi.player.id for xi in best_xi]][:7]

    # Categorize players
    aging = [p for p in players if p.age > avg_age + age_std_dev]
    veterans = [p for p in players if p.age > 30 and p.overall > avg_overall]
    young_stars = [p for p in players if p.age < avg_age - age_std_dev and p.overall > avg_overall]

    # Analyze position strengths
    position_strengths = {}
    configured_positions = [pc.position for pc in position_counts if pc.count > 0]
    
    for position in configured_positions:
        position_players = [p for p in players if p.mainPosition == position]
        count = len(position_players)

        has_prospect = any(p.age < avg_age - age_std_dev for p in position_players)
        has_veteran = any(p.age > 30 for p in position_players)
        has_normal = any(avg_age - age_std_dev <= p.age <= avg_age + age_std_dev for p in position_players)
        has_aging = any(p.age > avg_age + age_std_dev for p in position_players)

        message = None
        if count == 0:
            message = f"No players at {position}"
        elif count < 2:
            message = f"Need more players at {position}"
        elif not has_prospect:
            message = f"Need {position} prospects"

        position_strengths[position] = {
            'hasProspect': has_prospect,
            'hasVeteran': has_veteran,
            'hasNormal': has_normal,
            'hasAging': has_aging,
            'count': count,
            'message': message
        }

    # Analyze sector strengths
    sector_strengths = {}
    for sector, positions in SECTORS.items():
        sector_players = [p for p in players if p.mainPosition in positions]
        count = len(sector_players)
        
        message = None
        if count < 3:
            message = f"Weak {sector} depth"
        elif count > 8:
            message = f"Strong {sector} depth"

        sector_strengths[sector] = {
            'count': count,
            'message': message
        }

    return TeamAnalysis(
        bestXI=best_xi,
        bench=bench,
        aging=aging,
        veterans=veterans,
        youngStars=young_stars,
        positionStrengths=position_strengths,
        sectorStrengths=sector_strengths
    )

def main():
    """Main function to handle command line input/output"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Parse input data
        players_data = input_data.get('players', [])
        position_counts_data = input_data.get('positionCounts', [])
        position_priorities_data = input_data.get('positionPriorities', [])
        toggled_positions = input_data.get('toggledPositions', [])

        # Convert to dataclass objects
        players = []
        for p_data in players_data:
            attributes = PlayerAttributes(**p_data['attributes'])
            player = Player(
                id=p_data['id'],
                name=p_data['name'],
                shortName=p_data['shortName'],
                age=p_data['age'],
                nationality=p_data['nationality'],
                fifaCode=p_data['fifaCode'],
                mainPosition=p_data['mainPosition'],
                alternatePositions=p_data['alternatePositions'],
                role=p_data['role'],
                attributes=attributes,
                overall=p_data['overall'],
                potential=p_data['potential'],
                preferred_foot=p_data['preferred_foot'],
                stats=p_data['stats']
            )
            players.append(player)

        position_counts = [PositionCount(**pc) for pc in position_counts_data]
        position_priorities = [PositionPriority(**pp) for pp in position_priorities_data]

        # Analyze team
        analysis = analyze_team(players, position_counts, position_priorities, toggled_positions)

        # Convert to JSON-serializable format
        result = {
            'bestXI': [
                {
                    'player': {
                        'id': pr.player.id,
                        'name': pr.player.name,
                        'shortName': pr.player.shortName,
                        'age': pr.player.age,
                        'nationality': pr.player.nationality,
                        'fifaCode': pr.player.fifaCode,
                        'mainPosition': pr.player.mainPosition,
                        'alternatePositions': pr.player.alternatePositions,
                        'role': pr.player.role,
                        'attributes': {
                            'pace': pr.player.attributes.pace,
                            'shooting': pr.player.attributes.shooting,
                            'passing': pr.player.attributes.passing,
                            'dribbling': pr.player.attributes.dribbling,
                            'defending': pr.player.attributes.defending,
                            'physical': pr.player.attributes.physical
                        },
                        'overall': pr.player.overall,
                        'potential': pr.player.potential,
                        'preferred_foot': pr.player.preferred_foot,
                        'stats': pr.player.stats
                    },
                    'rating': pr.rating,
                    'position': pr.position
                }
                for pr in analysis.bestXI
            ],
            'bench': [
                {
                    'player': {
                        'id': pr.player.id,
                        'name': pr.player.name,
                        'shortName': pr.player.shortName,
                        'age': pr.player.age,
                        'nationality': pr.player.nationality,
                        'fifaCode': pr.player.fifaCode,
                        'mainPosition': pr.player.mainPosition,
                        'alternatePositions': pr.player.alternatePositions,
                        'role': pr.player.role,
                        'attributes': {
                            'pace': pr.player.attributes.pace,
                            'shooting': pr.player.attributes.shooting,
                            'passing': pr.player.attributes.passing,
                            'dribbling': pr.player.attributes.dribbling,
                            'defending': pr.player.attributes.defending,
                            'physical': pr.player.attributes.physical
                        },
                        'overall': pr.player.overall,
                        'potential': pr.player.potential,
                        'preferred_foot': pr.player.preferred_foot,
                        'stats': pr.player.stats
                    },
                    'rating': pr.rating,
                    'position': pr.position
                }
                for pr in analysis.bench
            ],
            'aging': [
                {
                    'id': p.id,
                    'name': p.name,
                    'shortName': p.shortName,
                    'age': p.age,
                    'nationality': p.nationality,
                    'fifaCode': p.fifaCode,
                    'mainPosition': p.mainPosition,
                    'alternatePositions': p.alternatePositions,
                    'role': p.role,
                    'attributes': {
                        'pace': p.attributes.pace,
                        'shooting': p.attributes.shooting,
                        'passing': p.attributes.passing,
                        'dribbling': p.attributes.dribbling,
                        'defending': p.attributes.defending,
                        'physical': p.attributes.physical
                    },
                    'overall': p.overall,
                    'potential': p.potential,
                    'preferred_foot': p.preferred_foot,
                    'stats': p.stats
                }
                for p in analysis.aging
            ],
            'veterans': [
                {
                    'id': p.id,
                    'name': p.name,
                    'shortName': p.shortName,
                    'age': p.age,
                    'nationality': p.nationality,
                    'fifaCode': p.fifaCode,
                    'mainPosition': p.mainPosition,
                    'alternatePositions': p.alternatePositions,
                    'role': p.role,
                    'attributes': {
                        'pace': p.attributes.pace,
                        'shooting': p.attributes.shooting,
                        'passing': p.attributes.passing,
                        'dribbling': p.attributes.dribbling,
                        'defending': p.attributes.defending,
                        'physical': p.attributes.physical
                    },
                    'overall': p.overall,
                    'potential': p.potential,
                    'preferred_foot': p.preferred_foot,
                    'stats': p.stats
                }
                for p in analysis.veterans
            ],
            'youngStars': [
                {
                    'id': p.id,
                    'name': p.name,
                    'shortName': p.shortName,
                    'age': p.age,
                    'nationality': p.nationality,
                    'fifaCode': p.fifaCode,
                    'mainPosition': p.mainPosition,
                    'alternatePositions': p.alternatePositions,
                    'role': p.role,
                    'attributes': {
                        'pace': p.attributes.pace,
                        'shooting': p.attributes.shooting,
                        'passing': p.attributes.passing,
                        'dribbling': p.attributes.dribbling,
                        'defending': p.attributes.defending,
                        'physical': p.attributes.physical
                    },
                    'overall': p.overall,
                    'potential': p.potential,
                    'preferred_foot': p.preferred_foot,
                    'stats': p.stats
                }
                for p in analysis.youngStars
            ],
            'positionStrengths': analysis.positionStrengths,
            'sectorStrengths': analysis.sectorStrengths
        }

        # Output result to stdout
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main() 