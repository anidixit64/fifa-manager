import json

def remove_duplicates_by_team_name(data_list):
    """
    Removes dictionaries from a list where the value of the "Team Name" field is a duplicate.
    Keeps the first occurrence.

    Args:
        data_list (list): A list of dictionaries.

    Returns:
        list: A new list of dictionaries with duplicates removed.
    """
    if not isinstance(data_list, list):
        # This check is important if the root of the JSON isn't a list
        print(f"Warning: Input data is not a list. Type: {type(data_list)}. Returning original data.")
        return data_list

    seen_team_names = set()
    unique_list = []

    for item in data_list:
        if not isinstance(item, dict):
            print(f"Warning: Skipping non-dictionary item in the list: {item}")
            unique_list.append(item) # Optionally include non-dict items as is
            continue

        team_name = item.get("Team Name") # Use .get() to avoid KeyError if field is missing

        # If team_name is None (due to missing key or "Team Name": null),
        # it will be added to seen_team_names and only the first such item will be kept.
        if team_name not in seen_team_names:
            unique_list.append(item)
            seen_team_names.add(team_name) # Add even if None to de-duplicate items with null/missing team names
        # else:
            # print(f"Duplicate found and removed for Team Name: {team_name}")
            
    return unique_list

def process_teams_json(input_filepath="teams.json", output_filepath="unique_teams.json"):
    """
    Reads a JSON file, removes duplicates based on "Team Name",
    and saves the result to a new JSON file.
    """
    try:
        with open(input_filepath, 'r', encoding='utf-8') as f_in:
            original_data = json.load(f_in)
        print(f"Successfully loaded data from '{input_filepath}'")

    except FileNotFoundError:
        print(f"Error: The file '{input_filepath}' was not found in the current directory.")
        return
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from '{input_filepath}': {e}")
        return
    except Exception as e:
        print(f"An unexpected error occurred while reading the file: {e}")
        return

    # --- Optional: Print original data for verification ---
    # print("\n--- Original Data ---")
    # print(json.dumps(original_data, indent=4))
    # print("---------------------\n")

    unique_data = remove_duplicates_by_team_name(original_data)

    print("\n--- Data After Removing Duplicates ---")
    print(json.dumps(unique_data, indent=4))
    print("------------------------------------\n")

    try:
        with open(output_filepath, 'w', encoding='utf-8') as f_out:
            json.dump(unique_data, f_out, indent=4)
        print(f"Successfully saved unique data to '{output_filepath}'")
    except IOError as e:
        print(f"Error writing to file '{output_filepath}': {e}")
    except Exception as e:
        print(f"An unexpected error occurred while writing the file: {e}")


if __name__ == "__main__":
    # Call the processing function.
    # You can change the input and output filenames here if needed.
    process_teams_json(input_filepath="teams.json", output_filepath="unique_teams.json")