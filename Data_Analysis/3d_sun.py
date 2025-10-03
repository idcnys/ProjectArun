import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import matplotlib.cm as cm
from matplotlib.patches import Patch

# Load data
df = pd.read_csv("gpr_1874_1976_corrected.csv")
df["date"] = pd.to_datetime(dict(
    year=df.year, month=df.month, day=df.day,
    hour=df.hour, minute=df.minute, second=df.second
))

# Solar cycles
solar_cycles = [
    (1879, 1890), (1890, 1901), (1901, 1912), (1912, 1923),
    (1923, 1934), (1934, 1944), (1944, 1955), (1955, 1966),
    (1966, 1977)
]

# Filter spots with area >= 50
df = df[df["area"] >= 50]

latitudes, longitudes = [], []
top_spots = []

for i, (start, end) in enumerate(solar_cycles):
    cycle = df[(df["year"] >= start) & (df["year"] < end)].copy()
    if cycle.empty:
        continue

    latitudes.extend(cycle["latitude"])
    longitudes.extend(cycle["longitude"])

    # Top 10 biggest spots in this cycle
    top10 = cycle.nlargest(10, "area")
    top_spots.append((i, top10))

# --- Enhanced Plot ---
fig, ax = plt.subplots(figsize=(14, 7))

# Background: faint scatter of all sunspots
ax.scatter(longitudes, latitudes, c="lightgray", s=10, alpha=0.4, 
           label="All Sunspots (Area ≥ 50)", zorder=1)

# Distinct colormap for cycles
colors = cm.tab10(np.linspace(0, 1, len(solar_cycles)))

# Overlay top 10 per cycle with size based on area
for i, top10 in top_spots:
    # Size proportional to area (with scaling for visibility)
    sizes = (top10["area"] / top10["area"].max()) * 200 + 50
    
    ax.scatter(
        top10["longitude"], top10["latitude"],
        s=sizes, c=[colors[i]], edgecolors="black", linewidths=1,
        marker="o", alpha=0.8, zorder=2
    )

# Add equator line
ax.axhline(y=0, color='blue', linestyle='--', linewidth=1, alpha=0.5, label='Equator')

# Add typical active latitude zones (±30°)
ax.axhline(y=30, color='red', linestyle=':', linewidth=0.8, alpha=0.4)
ax.axhline(y=-30, color='red', linestyle=':', linewidth=0.8, alpha=0.4, label='Active Zones (±30°)')

# Styling
ax.set_title("Sunspot Distribution: Top 10 Spots per Solar Cycle (1879-1977)", 
             fontsize=14, fontweight='bold', pad=15)
ax.set_xlabel("Longitude (°)", fontsize=12)
ax.set_ylabel("Latitude (°)", fontsize=12)
ax.set_xlim(0, 360)
ax.set_ylim(-90, 90)
ax.grid(alpha=0.3, linestyle='--')

# Custom legend with cycle colors
legend_elements = [Patch(facecolor=colors[i], edgecolor='black', 
                         label=f'{start}–{end}')
                   for i, (start, end) in enumerate(solar_cycles)]
legend_elements.insert(0, plt.Line2D([0], [0], marker='o', color='w', 
                                     markerfacecolor='lightgray', markersize=6, 
                                     alpha=0.4, label='All Sunspots'))
legend_elements.append(plt.Line2D([0], [0], color='blue', linestyle='--', 
                                  linewidth=1, alpha=0.5, label='Equator'))
legend_elements.append(plt.Line2D([0], [0], color='red', linestyle=':', 
                                  linewidth=0.8, alpha=0.4, label='Active Zones (±30°)'))

ax.legend(handles=legend_elements, bbox_to_anchor=(1.02, 1), 
          loc="upper left", fontsize=9, title="Solar Cycles")

plt.tight_layout()
plt.show()