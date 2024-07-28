import pandas as pd
import json
import sys

def excel_to_json(excel_file, json_file):
    # Read the Excel file
    df = pd.read_excel(excel_file)
    
    # Convert DataFrame to JSON
    json_data = df.to_json(orient='records', indent=4)
    
    # Save JSON to file
    with open(json_file, 'w') as f:
        f.write(json_data)
    
    print(f"Excel data successfully converted to {json_file}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python excel_to_json.py <input_excel_file> <output_json_file>")
    else:
        input_excel = sys.argv[1]
        output_json = sys.argv[2]
        excel_to_json(input_excel, output_json)
