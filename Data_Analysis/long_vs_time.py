import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
plt.style.use("dark_background")
df = pd.read_csv("/content/drive/MyDrive/gpr_1874_1976_corrected.csv")
df["date"] = pd.to_datetime(dict(
    year=df.year, month=df.month, day=df.day,
    hour=df.hour, minute=df.minute, second=df.second
))
df["longitude_wrapped"] = df["longitude"].apply(lambda x: x-360 if x > 180 else x)
plt.figure(figsize=(14,7))
sc = plt.scatter(
    df["longitude_wrapped"], df["date"],
    s=np.sqrt(df["area"])*2,
    alpha=0.85,
    c=df["area"],   
    cmap="plasma", 
    edgecolors="white", linewidth=0.2
)
plt.title("Time vs Longitude — Sunspot Area Highlighted", fontsize=16, color="white")
plt.xlabel("Longitude (°)", fontsize=14, color="white")
plt.ylabel("Time", fontsize=14, color="white")
plt.ylim(df["date"].min(), df["date"].max())
cbar = plt.colorbar(sc)
cbar.set_label("Sunspot Area (µHem)", fontsize=12, color="white")
cbar.ax.yaxis.set_tick_params(color="white")
plt.setp(cbar.ax.get_yticklabels(), color="white")
plt.tight_layout()
plt.show()
