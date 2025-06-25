import os
import random
import re
import sys

# --- Configuration ---
# Set to False to perform actual renaming AFTER checking the dry run output.
DRY_RUN = False
# Base directory containing the numbered asset folders (relative to this script)
ASSETS_BASE_DIR = "public/assets"
# Range of folder numbers to process (inclusive)
FOLDER_NUM_START = 7
FOLDER_NUM_END = 24
# Regex to find the style digit at the end, before '_.png'
# Captures: (1: base filename part including _Style_), (2: the digit), (3: the _.png suffix)
FILENAME_PATTERN = re.compile(r"^(.*_Style_)(\d)(_\.png)$", re.IGNORECASE)
# --- End Configuration ---

def get_folder_map(base_dir):
    """Creates a map of number prefix to full folder path."""
    folder_map = {}
    try:
        for item in os.listdir(base_dir):
            item_path = os.path.join(base_dir, item)
            if os.path.isdir(item_path):
                # Extract number prefix if it exists
                match = re.match(r"^(\d+)\s+", item)
                if match:
                    num_prefix = int(match.group(1))
                    folder_map[num_prefix] = item_path
    except FileNotFoundError:
        print(f"Error: Base assets directory not found at '{os.path.abspath(base_dir)}'")
        sys.exit(1)
    except Exception as e:
        print(f"Error scanning asset directories: {e}")
        sys.exit(1)
    return folder_map

def process_folders(folder_map, start_num, end_num):
    """Processes the specified range of folders."""
    rename_count = 0
    skipped_count = 0
    processed_folders_count = 0

    print(f"Starting processing (DRY_RUN = {DRY_RUN})...")
    print(f"Targeting folders numbered {start_num} through {end_num}.")

    for folder_num in range(start_num, end_num + 1):
        if folder_num not in folder_map:
            # print(f"Info: No folder found with prefix {folder_num:02d}, skipping.")
            continue

        folder_path = folder_map[folder_num]
        print(f"\n--- Processing folder: {os.path.basename(folder_path)} ---")
        processed_folders_count += 1
        found_match_in_folder = False

        try:
            for filename in os.listdir(folder_path):
                file_path = os.path.join(folder_path, filename)

                if not os.path.isfile(file_path):
                    continue

                match = FILENAME_PATTERN.match(filename)
                if match:
                    found_match_in_folder = True
                    base_part, old_digit_str, suffix = match.groups()
                    old_digit = int(old_digit_str)

                    # Generate new random digit (0, 1, or 2)
                    new_digit = random.randint(0, 2)

                    # Construct new name
                    new_filename = f"{base_part}{new_digit}{suffix}"
                    new_file_path = os.path.join(folder_path, new_filename)

                    if filename.lower() == new_filename.lower():
                        # print(f"Skipping: '{filename}' (new name is the same)")
                        skipped_count += 1
                        continue

                    if os.path.exists(new_file_path):
                        print(f"Skipping: Cannot rename '{filename}' because target '{new_filename}' already exists.")
                        skipped_count += 1
                        continue

                    # Log action and potentially perform rename
                    action_prefix = "DRY RUN:" if DRY_RUN else "Renaming:"
                    print(f"{action_prefix} '{filename}' -> '{new_filename}' (Old: {old_digit}, New: {new_digit})")
                    rename_count += 1

                    if not DRY_RUN:
                        try:
                            os.rename(file_path, new_file_path)
                        except OSError as e:
                            print(f"  Error renaming '{filename}': {e}")
                            # Decrement count as rename failed
                            rename_count -= 1
                            skipped_count += 1
            # End loop through files

            if not found_match_in_folder:
                 print("(No files matching the pattern '_Style_[digit]_.png' found in this folder)")

        except Exception as e:
            print(f"Error processing files in '{folder_path}': {e}")

    # End loop through folders
    print("\n--- Processing Complete ---")
    print(f"Processed {processed_folders_count} folders.")
    action_verb = "Would rename" if DRY_RUN else "Renamed"
    print(f"{action_verb}: {rename_count} files.")
    print(f"Skipped: {skipped_count} files (no change needed, target exists, or error).")
    if DRY_RUN:
        print("\nIMPORTANT: This was a dry run. No files were actually changed.")
        print("Review the output carefully. If it looks correct, edit the script")
        print("to set DRY_RUN = False and run it again to perform the renaming.")
        print("REMEMBER TO BACK UP YOUR ASSETS FIRST!")
    else:
        print("\nFile renaming process finished.")


if __name__ == "__main__":
    script_dir = os.path.dirname(__file__)
    base_path = os.path.join(script_dir, ASSETS_BASE_DIR)
    folder_mapping = get_folder_map(base_path)
    if not folder_mapping:
        print("Error: Could not map asset folders. Exiting.")
    else:
      process_folders(folder_mapping, FOLDER_NUM_START, FOLDER_NUM_END)
