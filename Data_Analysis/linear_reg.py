import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
import numpy as np
df = pd.read_csv("gpr_1874_1976_corrected.csv")
df["date"] = pd.to_datetime(dict(
    year=df.year, month=df.month, day=df.day,
    hour=df.hour, minute=df.minute, second=df.second
))
sunspots = []
for group_id, g in df.groupby("group_id"):
    if g.empty:
        continue
    duration = (g["date"].max() - g["date"].min()).days + 1
    max_area = g["area"].max()
    if max_area > 0 and duration > 0:
        sunspots.append((max_area, duration))
sun_df = pd.DataFrame(sunspots, columns=["area", "duration"])
sun_df = sun_df[(sun_df["area"] > 500) & (sun_df["duration"] > 7) & (sun_df["duration"] <= 100)]
X = sun_df[["area"]].values
y = sun_df["duration"].values
model = LinearRegression()
model.fit(X, y)
x_fit = np.linspace(X.min(), X.max(), 200).reshape(-1, 1)
y_fit = model.predict(x_fit)
slope = model.coef_[0]
intercept = model.intercept_
r2 = model.score(X, y)
equation_text = f"y = {slope:.5f}x + {intercept:.2f}, R² = {r2:.3f}"

plt.figure(figsize=(10,6))
plt.scatter(sun_df["area"], sun_df["duration"], s=10, alpha=0.5, label="Sunspots")
plt.plot(x_fit, y_fit, color="red", linewidth=2, label=equation_text)
plt.xlabel("Max Area (micro-hemispheres)")
plt.ylabel("Duration (days)")
plt.title("Sunspot Area vs Duration (Filtered: Area>500)")
plt.ylim(0, 100)
plt.legend()
plt.savefig("analysis/linear_regression_area_duration.png", dpi=300)
