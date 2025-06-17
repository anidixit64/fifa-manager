import json

def truncate_fifa_data(input_filepath, output_filepath, fields_to_keep):
    """
    Reads a JSON file containing a list of player objects, truncates each object
    to include only the specified fields, and writes the result to a new JSON file.

    Args:
        input_filepath (str): Path to the input JSON file.
        output_filepath (str): Path where the truncated JSON file will be saved.
        fields_to_keep (list): A list of strings representing the keys to keep
                               from each player object.
    """
    try:
        with open(input_filepath, 'r', encoding='utf-8') as f_in:
            all_players_data = json.load(f_in)
    except FileNotFoundError:
        print(f"Error: Input file '{input_filepath}' not found.")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from '{input_filepath}'. Ensure it's a valid JSON.")
        return
    except Exception as e:
        print(f"An unexpected error occurred while reading the input file: {e}")
        return

    if not isinstance(all_players_data, list):
        print(f"Error: Expected a JSON list at the root of '{input_filepath}', but got {type(all_players_data)}.")
        return

    truncated_players_list = []
    for player_original in all_players_data:
        if not isinstance(player_original, dict):
            print(f"Warning: Skipping an item in the list that is not a dictionary: {player_original}")
            continue

        player_new = {}
        for field in fields_to_keep:
            if field in player_original:
                player_new[field] = player_original[field]
            else:
                # Optional: Log a warning if a desired field is missing
                # print(f"Warning: Field '{field}' not found in player with ID '{player_original.get('player_id', 'Unknown')}'.")
                # You could also choose to add it with a default value, e.g., player_new[field] = None
                pass # Silently skip if field doesn't exist in the source object

        # Only add the new player object if it's not empty (e.g., if none of the fields_to_keep were found)
        # Though, for this specific use case, it's likely you always want an entry if the original player existed.
        truncated_players_list.append(player_new)

    try:
        with open(output_filepath, 'w', encoding='utf-8') as f_out:
            json.dump(truncated_players_list, f_out, indent=2, ensure_ascii=False)
        print(f"Successfully truncated data and saved to '{output_filepath}'")
        print(f"Kept fields: {', '.join(fields_to_keep)}")
    except IOError:
        print(f"Error: Could not write to output file '{output_filepath}'.")
    except Exception as e:
        print(f"An unexpected error occurred while writing the output file: {e}")

# --- Configuration ---
input_json_file = "players_orig.json"  # Replace with your actual input file name
output_json_file = "players.json"
fields_to_retain = ['short_name', 'long_name', 'potential', 'nationality_name', 'preferred_foot']

# --- How to use: ---
# 1. Save the code above as a Python file (e.g., `truncate_json.py`).
# 2. Place your large JSON file (e.g., `your_fifa_players_data.json`) in the same directory.
# 3. Update the `input_json_file` variable in the script if your file has a different name.
# 4. Run the script from your terminal: `python truncate_json.py`

# --- Example: Create a dummy input file for testing (if you don't have one ready) ---
def create_dummy_input_file(filename, data):
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Dummy input file '{filename}' created for testing.")
    except Exception as e:
        print(f"Could not create dummy file: {e}")

if __name__ == "__main__":
    # This block is for testing. You can remove or comment it out
    # if you have your actual input_json_file ready.
    sample_data_for_testing = [
        {"player_id": "231747", "player_url": "/player/231747/kylian-mbappe/240002", "fifa_version": "24.0", "fifa_update": "2.0", "update_as_of": "2023-09-22", "short_name": "K. Mbapp\u00e9", "long_name": "Kylian Mbapp\u00e9 Lottin", "player_positions": "ST, LW", "overall": "91", "potential": "94", "value_eur": "181500000.0", "wage_eur": "230000.0", "age": "24", "club_name": "Paris Saint Germain", "pace": "97", "shooting": "90", "passing": "80", "dribbling": "92", "defending": "36", "physic": "78"},
        {"player_id": "239085", "player_url": "/player/239085/erling-haaland/240002", "fifa_version": "24.0", "fifa_update": "2.0", "update_as_of": "2023-09-22", "short_name": "E. Haaland", "long_name": "Erling Braut Haaland", "player_positions": "ST", "overall": "91", "potential": "94", "value_eur": "185000000.0", "wage_eur": "340000.0", "age": "22", "club_name": "Manchester City", "pace": "89", "shooting": "93", "passing": "66", "dribbling": "80", "defending": "45", "physic": "88"},
        {"player_id": "192985", "player_url": "/player/192985/kevin-de-bruyne/240002", "fifa_version": "24.0", "fifa_update": "2.0", "update_as_of": "2023-09-22", "short_name": "K. De Bruyne", "long_name": "Kevin De Bruyne", "player_positions": "CM, CAM", "overall": "91", "potential": "91", "value_eur": "103000000.0", "wage_eur": "350000.0", "age": "32", "club_name": "Manchester City", "pace": "72", "shooting": "88", "passing": "94", "dribbling": "87", "defending": "65", "physic": "78"},
        {"player_id": "999999", "short_name": "Missing Potential", "long_name": "Player Test", "age": "25"} # Test missing field
    ]
    # To run the test, uncomment the next line and make sure input_json_file matches.
    # create_dummy_input_file(input_json_file, sample_data_for_testing)

    # Actual function call
    truncate_fifa_data(input_json_file, output_json_file, fields_to_retain)