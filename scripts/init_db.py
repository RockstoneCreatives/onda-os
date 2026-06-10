#!/usr/bin/env python3
"""Import wine data from Excel into Supabase."""

import os
from pathlib import Path
import pandas as pd
from supabase import create_client

# Environment variables
SUPABASE_URL = "https://xqyktmvouaqryrcbmnvc.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
EXCEL_PATH = Path(__file__).parent.parent.parent / "ONDA - Master Wine List NEW.xlsx"

if not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_SERVICE_ROLE_KEY not set in environment")

# Initialize Supabase client with service role key
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def import_wines():
    """Import wines from Excel file into Supabase."""
    print(f"Importing wines from {EXCEL_PATH}...")

    if not EXCEL_PATH.exists():
        raise FileNotFoundError(f"Excel file not found: {EXCEL_PATH}")

    # Read Excel file
    df = pd.read_excel(EXCEL_PATH, sheet_name="Main")

    # Filter to active wines only
    df = df[df["Status"] == "Active"].copy()

    print(f"Found {len(df)} active wines")

    # Prepare data for insertion
    wines = []
    for _, row in df.iterrows():
        wine = {
            "colour_style": str(row.get("Colour/Style")) if pd.notna(row.get("Colour/Style")) else "",
            "region": str(row.get("Region")) if pd.notna(row.get("Region")) else None,
            "country": str(row.get("Country")) if pd.notna(row.get("Country")) else None,
            "producer": str(row.get("Producer")) if pd.notna(row.get("Producer")) else "",
            "name": str(row.get("Name")) if pd.notna(row.get("Name")) else "",
            "vintage": str(row.get("Vintage")) if pd.notna(row.get("Vintage")) else None,
            "grapes": str(row.get("Grapes")) if pd.notna(row.get("Grapes")) else None,
            "btg": row.get("BTG") == "Yes" if pd.notna(row.get("BTG")) else False,
            "importer": str(row.get("Importer")) if pd.notna(row.get("Importer")) else None,
            "cost_price": float(row.get("Price")) if pd.notna(row.get("Price")) else None,
            "sale_price": float(row.get("Sale Price")) if pd.notna(row.get("Sale Price")) else None,
            "glass_price": float(row.get("Glass")) if pd.notna(row.get("Glass")) else None,
            "inventory_location": str(row.get("Inventory")) if pd.notna(row.get("Inventory")) else None,
            "status": "Active"
        }
        wines.append(wine)

    # Insert in batches
    batch_size = 50
    for i in range(0, len(wines), batch_size):
        batch = wines[i:i + batch_size]
        try:
            result = supabase.table("wines").insert(batch).execute()
            print(f"✓ Inserted {len(batch)} wines (batch {i // batch_size + 1})")
        except Exception as e:
            print(f"Error inserting batch: {e}")
            raise

    print(f"✓ Successfully imported {len(wines)} wines")


if __name__ == "__main__":
    try:
        import_wines()
        print("\n✓ Wine import complete!")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        raise
