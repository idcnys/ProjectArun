#import pandas as pd
#import matplotlib.pyplot as plt
#import numpy as np
#from sklearn.linear_model import LinearRegression
#import os
##LOAD DATA
#df = pd.read_csv("gpr_1874_1976_corrected.csv")
#
## Convert date/time into datetime
#df["date"] = pd.to_datetime(dict(
#    year=df.year, month=df.month, day=df.day,
#    hour=df.hour, minute=df.minute, second=df.second
#))
#
##SOLAR CYCLES 1879-1976 choosen manually
#solar_cycles = [
#    (1879, 1890), (1890, 1901), (1901, 1912), (1912, 1923),
#    (1923, 1934), (1934, 1944), (1944, 1955), (1955, 1966),
#    (1966, 1977)
#]
#
## Output folder
#output_folder = "analysis/solar_cycles_plots"
#os.makedirs(output_folder, exist_ok=True)
#
##LOOP OVER CYCLES
#for start_year, end_year in solar_cycles:
#    cycle_start = pd.Timestamp(f"{start_year}-01-01")
#    cycle_end = pd.Timestamp(f"{end_year}-12-31")
#    df_cycle = df[(df["date"] >= cycle_start) & (df["date"] <= cycle_end)]
#
#    if df_cycle.empty:
#        print(f"No data for cycle {start_year}-{end_year}, skipping...")
#        continue
#    #Max area per sunspot
#    records = []
#    for group_id, g in df_cycle.groupby("group_id"):
#        if g.empty:
#            continue
#        max_area = g["area"].max()
#        peak_row = g[g["area"] == max_area].iloc[0]
#        duration = len(g)
#        records.append((peak_row["date"], max_area, peak_row["latitude"], duration))
#    sun_cycle_df = pd.DataFrame(records, columns=["date", "area", "latitude", "duration"])
#    if sun_cycle_df.empty:
#        print(f"No sunspots for cycle {start_year}-{end_year}, skipping...")
#        continue
#    sun_cycle_df["days_since_start"] = (sun_cycle_df["date"] - cycle_start).dt.days
#    #Butterfly diagram data
#    x_butterfly = []
#    lat_butterfly = []
#    area_butterfly = []
#    for _, row in df_cycle.iterrows():
#        if row["area"] >= 50:
#            time_val = (
#                row.date.year + row.date.month/12 + row.date.day/365 +
#                row.date.hour/(24*365) + row.date.minute/(24*365*60) + row.date.second/(24*365*3600)
#            )
#            x_butterfly.append(time_val)
#            lat_butterfly.append(row.latitude)
#            area_butterfly.append(row.area)
#
#    #Filter sunspots for regression (graph 2)
#    sun_cycle_df_filtered = sun_cycle_df[(sun_cycle_df["area"] > 500) & (sun_cycle_df["duration"] > 5)]
#    if sun_cycle_df_filtered.empty:
#        print(f"No sunspots meeting regression criteria for cycle {start_year}-{end_year}...")
#        x_fit = []
#        y_fit = []
#    else:
#        # Linear Regression
#        X = sun_cycle_df_filtered[["area"]].values
#        y = sun_cycle_df_filtered["duration"].values
#        model = LinearRegression()
#        model.fit(X, y)
#        x_fit = np.linspace(X.min(), X.max(), 200).reshape(-1, 1)
#        y_fit = model.predict(x_fit)
#
#    #Plotting
#    fig, axes = plt.subplots(3, 1, figsize=(14, 20), constrained_layout=True)
#
#    # 1) Butterfly diagram (all sunspots with area >= 50)
#    sc = axes[0].scatter(x_butterfly, lat_butterfly, s=np.array(area_butterfly)/50,
#                         c=lat_butterfly, cmap='plasma', alpha=0.7)
#    axes[0].set_title(f"Butterfly Diagram (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    axes[0].set_xlabel("Year (fractional)", fontsize=12)
#    axes[0].set_ylabel("Latitude", fontsize=12)
#    cbar = plt.colorbar(sc, ax=axes[0])
#    cbar.set_label('Latitude', fontsize=12)
#
#    # 2) Sunspot Area vs Duration (regression only uses filtered sunspots)
#    axes[1].scatter(sun_cycle_df_filtered["area"], sun_cycle_df_filtered["duration"], s=40, alpha=0.7,
#                    label="Filtered Sunspot Peaks", color="mediumseagreen")
#    if len(x_fit) > 0:
#        axes[1].plot(x_fit, y_fit, color="crimson", linewidth=2, label="Linear Regression")
#    axes[1].set_xlabel("Max Area (micro-hemispheres)", fontsize=12)
#    axes[1].set_ylabel("Duration (days)", fontsize=12)
#    axes[1].set_title(f"Sunspot Area vs Duration (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    axes[1].legend()
#    if not sun_cycle_df_filtered.empty:
#        axes[1].set_ylim(0, max(sun_cycle_df_filtered["duration"].max(), 10)+5)
#
#    # 3) Bar plot of peak areas (all sunspots)
#    axes[2].bar(sun_cycle_df["days_since_start"], sun_cycle_df["area"], width=20, alpha=0.6, color="slategray")
#    axes[2].set_xlabel("Days since start of cycle", fontsize=12)
#    axes[2].set_ylabel("Sunspot Area (micro-hemispheres)", fontsize=12)
#    axes[2].set_title(f"Sunspot Maximum Areas vs Time (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    # Save figure
#    filename = os.path.join(output_folder, f"solarcycle_{start_year}-{end_year}.png")
#    plt.savefig(filename, dpi=300)
#    plt.close(fig)
#    print(f"Saved figure for Solar Cycle {start_year}-{end_year} -> {filename}")
#



#import pandas as pd
#import matplotlib.pyplot as plt
#import numpy as np
#from sklearn.linear_model import LinearRegression
#import os
#
## LOAD DATA
#df = pd.read_csv("gpr_1874_1976_corrected.csv")
#
## Convert date/time into datetime
#df["date"] = pd.to_datetime(dict(
#    year=df.year, month=df.month, day=df.day,
#    hour=df.hour, minute=df.minute, second=df.second
#))
#
## SOLAR CYCLES 1879-1976 choosen manually
#solar_cycles = [
#    (1879, 1890), (1890, 1901), (1901, 1912), (1912, 1923),
#    (1923, 1934), (1934, 1944), (1944, 1955), (1955, 1966),
#    (1966, 1977)
#]
#
## Output folder
#output_folder = "analysis/solar_cycles_plots"
#os.makedirs(output_folder, exist_ok=True)
#
## LOOP OVER CYCLES
#for start_year, end_year in solar_cycles:
#    cycle_start = pd.Timestamp(f"{start_year}-01-01")
#    cycle_end = pd.Timestamp(f"{end_year}-12-31")
#    df_cycle = df[(df["date"] >= cycle_start) & (df["date"] <= cycle_end)]
#
#    if df_cycle.empty:
#        print(f"No data for cycle {start_year}-{end_year}, skipping...")
#        continue
#
#    # Max area per sunspot
#    records = []
#    for group_id, g in df_cycle.groupby("group_id"):
#        if g.empty:
#            continue
#        max_area = g["area"].max()
#        peak_row = g[g["area"] == max_area].iloc[0]
#        duration = len(g)
#        records.append((peak_row["date"], max_area, peak_row["latitude"], duration))
#    sun_cycle_df = pd.DataFrame(records, columns=["date", "area", "latitude", "duration"])
#
#    if sun_cycle_df.empty:
#        print(f"No sunspots for cycle {start_year}-{end_year}, skipping...")
#        continue
#
#    sun_cycle_df["days_since_start"] = (sun_cycle_df["date"] - cycle_start).dt.days
#
#    # Butterfly diagram data
#    x_butterfly = []
#    lat_butterfly = []
#    area_butterfly = []
#    for _, row in df_cycle.iterrows():
#        if row["area"] >= 50:
#            time_val = (
#                row.date.year + row.date.month/12 + row.date.day/365 +
#                row.date.hour/(24*365) + row.date.minute/(24*365*60) + row.date.second/(24*365*3600)
#            )
#            x_butterfly.append(time_val)
#            lat_butterfly.append(row.latitude)
#            area_butterfly.append(row.area)
#
#    # Filter sunspots for regression (graph 2)
#    sun_cycle_df_filtered = sun_cycle_df[(sun_cycle_df["area"] > 500) & (sun_cycle_df["duration"] > 5)]
#    if sun_cycle_df_filtered.empty:
#        print(f"No sunspots meeting regression criteria for cycle {start_year}-{end_year}...")
#        x_fit = []
#        y_fit = []
#    else:
#        # Linear Regression
#        X = sun_cycle_df_filtered[["area"]].values
#        y = sun_cycle_df_filtered["duration"].values
#        model = LinearRegression()
#        model.fit(X, y)
#        x_fit = np.linspace(X.min(), X.max(), 200).reshape(-1, 1)
#        y_fit = model.predict(x_fit)
#
#    # Pick Top 10 biggest sunspots
#    topN = sun_cycle_df.nlargest(10, "area")
#
#    # Plotting
#    fig, axes = plt.subplots(3, 1, figsize=(14, 20), constrained_layout=True)
#
#    # 1) Butterfly diagram (all sunspots with area >= 50)
#    axes[0].scatter(x_butterfly, lat_butterfly,
#                    s=np.array(area_butterfly)/50,
#                    c="lightgray", alpha=0.5, label="All Spots")
#
#    sc = axes[0].scatter(
#        (topN["date"].dt.year + topN["date"].dt.month/12 + topN["date"].dt.day/365),
#        topN["latitude"],
#        s=topN["area"]/40,
#        c=topN["area"],
#        cmap="inferno_r",   # 🔄 darker = bigger
#        edgecolor="black",
#        alpha=0.9,
#        label="Top 10 Biggest"
#    )
#
#    axes[0].set_title(f"Butterfly Diagram (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    axes[0].set_xlabel("Year (fractional)", fontsize=12)
#    axes[0].set_ylabel("Latitude", fontsize=12)
#    cbar = plt.colorbar(sc, ax=axes[0])
#    cbar.set_label('Sunspot Area (µHem)', fontsize=12)
#    axes[0].legend()
#
#    # 2) Sunspot Area vs Duration (regression only uses filtered sunspots)
#    axes[1].scatter(sun_cycle_df_filtered["area"], sun_cycle_df_filtered["duration"],
#                    s=40, alpha=0.7, label="Filtered Sunspot Peaks", color="mediumseagreen")
#    if len(x_fit) > 0:
#        axes[1].plot(x_fit, y_fit, color="crimson", linewidth=2, label="Linear Regression")
#    axes[1].set_xlabel("Max Area (micro-hemispheres)", fontsize=12)
#    axes[1].set_ylabel("Duration (days)", fontsize=12)
#    axes[1].set_title(f"Sunspot Area vs Duration (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    axes[1].legend()
#    if not sun_cycle_df_filtered.empty:
#        axes[1].set_ylim(0, max(sun_cycle_df_filtered["duration"].max(), 10)+5)
#
#    # 3) Bar plot of peak areas (all sunspots)
#    colors = ["lightgray"] * len(sun_cycle_df)
#    for idx in topN.index:
#        colors[sun_cycle_df.index.get_loc(idx)] = plt.cm.inferno_r(
#            sun_cycle_df.loc[idx, "area"] / sun_cycle_df["area"].max()
#        )
#
#    axes[2].bar(sun_cycle_df["days_since_start"], sun_cycle_df["area"],
#                width=20, alpha=0.6, color=colors)
#    axes[2].set_xlabel("Days since start of cycle", fontsize=12)
#    axes[2].set_ylabel("Sunspot Area (micro-hemispheres)", fontsize=12)
#    axes[2].set_title(f"Sunspot Maximum Areas vs Time (Solar Cycle {start_year}-{end_year})", fontsize=16)
#
#    # Save figure
#    filename = os.path.join(output_folder, f"solarcycle_{start_year}-{end_year}.png")
#    plt.savefig(filename, dpi=300)
#    plt.close(fig)
#    print(f"Saved figure for Solar Cycle {start_year}-{end_year} -> {filename}")
#

#import pandas as pd
#import matplotlib.pyplot as plt
#import numpy as np
#from sklearn.linear_model import LinearRegression
#import os
#
## LOAD DATA
#df = pd.read_csv("gpr_1874_1976_corrected.csv")
#
## Convert date/time into datetime
#df["date"] = pd.to_datetime(dict(
#    year=df.year, month=df.month, day=df.day,
#    hour=df.hour, minute=df.minute, second=df.second
#))
#
## SOLAR CYCLES 1879-1976 choosen manually
#solar_cycles = [
#    (1879, 1890), (1890, 1901), (1901, 1912), (1912, 1923),
#    (1923, 1934), (1934, 1944), (1944, 1955), (1955, 1966),
#    (1966, 1977)
#]
#
## Output folder
#output_folder = "analysis/solar_cycles_plots"
#os.makedirs(output_folder, exist_ok=True)
#
## LOOP OVER CYCLES
#for start_year, end_year in solar_cycles:
#    cycle_start = pd.Timestamp(f"{start_year}-01-01")
#    cycle_end = pd.Timestamp(f"{end_year}-12-31")
#    df_cycle = df[(df["date"] >= cycle_start) & (df["date"] <= cycle_end)]
#
#    if df_cycle.empty:
#        print(f"No data for cycle {start_year}-{end_year}, skipping...")
#        continue
#
#    # Max area per sunspot group
#    records = []
#    for group_id, g in df_cycle.groupby("group_id"):
#        if g.empty:
#            continue
#        max_area = g["area"].max()
#        peak_row = g[g["area"] == max_area].iloc[0]
#        duration = len(g)
#        records.append((peak_row["date"], max_area, peak_row["latitude"], duration))
#    sun_cycle_df = pd.DataFrame(records, columns=["date", "area", "latitude", "duration"])
#
#    if sun_cycle_df.empty:
#        print(f"No sunspots for cycle {start_year}-{end_year}, skipping...")
#        continue
#
#    sun_cycle_df["days_since_start"] = (sun_cycle_df["date"] - cycle_start).dt.days
#
#    # Butterfly diagram data (all sunspots >= 50 area)
#    x_butterfly, lat_butterfly, area_butterfly = [], [], []
#    for _, row in df_cycle.iterrows():
#        if row["area"] >= 50:
#            time_val = (
#                row.date.year + row.date.month/12 + row.date.day/365 +
#                row.date.hour/(24*365) + row.date.minute/(24*365*60) + row.date.second/(24*365*3600)
#            )
#            x_butterfly.append(time_val)
#            lat_butterfly.append(row.latitude)
#            area_butterfly.append(row.area)
#
#    # Pick Top 10 biggest sunspots
#    topN = sun_cycle_df.nlargest(10, "area")
#
#    # Plotting
#    fig, axes = plt.subplots(3, 1, figsize=(14, 20), constrained_layout=True)
#
#    # 1) Butterfly diagram
#    axes[0].scatter(x_butterfly, lat_butterfly,
#                    s=np.array(area_butterfly)/50,
#                    c="lightgray", alpha=0.5, label="All Spots")
#
#    sc = axes[0].scatter(
#        (topN["date"].dt.year + topN["date"].dt.month/12 + topN["date"].dt.day/365),
#        topN["latitude"],
#        s=topN["area"]/40,
#        c=topN["area"],
#        cmap="inferno_r",   # 🔄 darker = bigger
#        edgecolor="black",
#        alpha=0.9,
#        label="Top 10 Biggest"
#    )
#
#    axes[0].set_title(f"Butterfly Diagram (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    axes[0].set_xlabel("Year (fractional)", fontsize=12)
#    axes[0].set_ylabel("Latitude", fontsize=12)
#    cbar = plt.colorbar(sc, ax=axes[0])
#    cbar.set_label('Sunspot Area (µHem)', fontsize=12)
#    axes[0].legend()
#
#    # 2) Sunspot Area vs Duration (your new regression logic)
#    sunspots = []
#    for group_id, g in df_cycle.groupby("group_id"):
#        if g.empty:
#            continue
#        duration = (g["date"].max() - g["date"].min()).days + 1
#        max_area = g["area"].max()
#        if max_area > 0 and duration > 0:
#            sunspots.append((max_area, duration))
#    sun_df = pd.DataFrame(sunspots, columns=["area", "duration"])
#
#    # Apply filtering
#    sun_df = sun_df[(sun_df["area"] > 500) & (sun_df["duration"] > 7) & (sun_df["duration"] <= 100)]
#
#    if not sun_df.empty:
#        X = sun_df[["area"]].values
#        y = sun_df["duration"].values
#
#        model = LinearRegression()
#        model.fit(X, y)
#
#        x_fit = np.linspace(X.min(), X.max(), 200).reshape(-1, 1)
#        y_fit = model.predict(x_fit)
#
#        slope = model.coef_[0]
#        intercept = model.intercept_
#        r2 = model.score(X, y)
#
#        equation_text = f"y = {slope:.5f}x + {intercept:.2f}, R² = {r2:.3f}"
#
#        axes[1].scatter(sun_df["area"], sun_df["duration"], s=10, alpha=0.5, label="Sunspots")
#        axes[1].plot(x_fit, y_fit, color="red", linewidth=2, label=equation_text)
#
#        axes[1].set_ylim(0, 100)
#        axes[1].set_xlabel("Max Area (micro-hemispheres)", fontsize=12)
#        axes[1].set_ylabel("Duration (days)", fontsize=12)
#        axes[1].set_title(f"Sunspot Area vs Duration (Solar Cycle {start_year}-{end_year})", fontsize=16)
#        axes[1].legend()
#    else:
#        axes[1].text(0.5, 0.5, "No valid data", transform=axes[1].transAxes,
#                     ha="center", va="center", fontsize=12, color="red")
#        axes[1].set_title(f"Sunspot Area vs Duration (Solar Cycle {start_year}-{end_year})", fontsize=16)
#
#    # 3) Bar plot of peak areas
#    colors = ["lightgray"] * len(sun_cycle_df)
#    for idx in topN.index:
#        colors[sun_cycle_df.index.get_loc(idx)] = plt.cm.inferno_r(
#            sun_cycle_df.loc[idx, "area"] / sun_cycle_df["area"].max()
#        )
#
#    axes[2].bar(sun_cycle_df["days_since_start"], sun_cycle_df["area"],
#                width=20, alpha=0.6, color=colors)
#    axes[2].set_xlabel("Days since start of cycle", fontsize=12)
#    axes[2].set_ylabel("Sunspot Area (micro-hemispheres)", fontsize=12)
#    axes[2].set_title(f"Sunspot Maximum Areas vs Time (Solar Cycle {start_year}-{end_year})", fontsize=16)
#
#    # Save figure
#    filename = os.path.join(output_folder, f"solarcycle_{start_year}-{end_year}.png")
#    plt.savefig(filename, dpi=300)
#    plt.close(fig)
#    print(f"Saved figure for Solar Cycle {start_year}-{end_year} -> {filename}")
#

#import pandas as pd
#import matplotlib.pyplot as plt
#import numpy as np
#from sklearn.linear_model import LinearRegression
#import os
#
## LOAD DATA
#df = pd.read_csv("gpr_1874_1976_corrected.csv")
#
## Convert date/time into datetime
#df["date"] = pd.to_datetime(dict(
#    year=df.year, month=df.month, day=df.day,
#    hour=df.hour, minute=df.minute, second=df.second
#))
#
## SOLAR CYCLES 1879-1976 chosen manually
#solar_cycles = [
#    (1879, 1890), (1890, 1901), (1901, 1912), (1912, 1923),
#    (1923, 1934), (1934, 1944), (1944, 1955), (1955, 1966),
#    (1966, 1977)
#]
#
## Output folder
#output_folder = "analysis/solar_cycles_plots"
#os.makedirs(output_folder, exist_ok=True)
#
## LOOP OVER CYCLES
#for start_year, end_year in solar_cycles:
#    cycle_start = pd.Timestamp(f"{start_year}-01-01")
#    cycle_end = pd.Timestamp(f"{end_year}-12-31")
#    df_cycle = df[(df["date"] >= cycle_start) & (df["date"] <= cycle_end)]
#
#    if df_cycle.empty:
#        print(f"No data for cycle {start_year}-{end_year}, skipping...")
#        continue
#
#    # Max area per sunspot group
#    records = []
#    for group_id, g in df_cycle.groupby("group_id"):
#        if g.empty:
#            continue
#        max_area = g["area"].max()
#        peak_row = g[g["area"] == max_area].iloc[0]
#        duration = len(g)
#        records.append((peak_row["date"], max_area, peak_row["latitude"], duration))
#    sun_cycle_df = pd.DataFrame(records, columns=["date", "area", "latitude", "duration"])
#
#    if sun_cycle_df.empty:
#        print(f"No sunspots for cycle {start_year}-{end_year}, skipping...")
#        continue
#
#    sun_cycle_df["days_since_start"] = (sun_cycle_df["date"] - cycle_start).dt.days
#
#    # Butterfly diagram data
#    x_butterfly, lat_butterfly, area_butterfly = [], [], []
#    for _, row in df_cycle.iterrows():
#        if row["area"] >= 50:
#            time_val = (
#                row.date.year + row.date.month/12 + row.date.day/365 +
#                row.date.hour/(24*365) + row.date.minute/(24*365*60) + row.date.second/(24*365*3600)
#            )
#            x_butterfly.append(time_val)
#            lat_butterfly.append(row.latitude)
#            area_butterfly.append(row.area)
#
#    # Pick Top 10 biggest sunspots
#    topN = sun_cycle_df.nlargest(10, "area")
#
#    # Create a consistent color mapping for top 10 using a reversed colormap
#    cmap = plt.cm.inferno_r
#    norm = plt.Normalize(vmin=topN["area"].min(), vmax=topN["area"].max())
#    color_map = {idx: cmap(norm(area)) for idx, area in zip(topN.index, topN["area"])}
#
#    # Plotting
#    fig, axes = plt.subplots(3, 1, figsize=(14, 20), constrained_layout=True)
#
#    # 1) Butterfly diagram
#    axes[0].scatter(x_butterfly, lat_butterfly,
#                    s=np.array(area_butterfly)/50,
#                    c="lightgray", alpha=0.5, label="All Spots")
#
#    for idx in topN.index:
#        spot = topN.loc[idx]
#        axes[0].scatter(
#            spot["date"].year + spot["date"].month/12 + spot["date"].day/365,
#            spot["latitude"],
#            s=spot["area"]/40,
#            color=color_map[idx],
#            edgecolor="black",
#            alpha=0.9,
#            label=f"Top {idx}"
#        )
#
#    axes[0].set_title(f"Butterfly Diagram (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    axes[0].set_xlabel("Year (fractional)", fontsize=12)
#    axes[0].set_ylabel("Latitude", fontsize=12)
#    axes[0].legend(loc="upper right", fontsize=8)
#
#    cbar = plt.colorbar(plt.cm.ScalarMappable(norm=norm, cmap=cmap), ax=axes[0])
#    cbar.set_label('Sunspot Area (µHem)', fontsize=12)
#
#    # 2) Sunspot Area vs Duration
#    sunspots = []
#    for group_id, g in df_cycle.groupby("group_id"):
#        if g.empty:
#            continue
#        duration = (g["date"].max() - g["date"].min()).days + 1
#        max_area = g["area"].max()
#        if max_area > 0 and duration > 0:
#            sunspots.append((max_area, duration))
#    sun_df = pd.DataFrame(sunspots, columns=["area", "duration"])
#    sun_df = sun_df[(sun_df["area"] > 500) & (sun_df["duration"] > 7) & (sun_df["duration"] <= 100)]
#
#    if not sun_df.empty:
#        X = sun_df[["area"]].values
#        y = sun_df["duration"].values
#        model = LinearRegression()
#        model.fit(X, y)
#        x_fit = np.linspace(X.min(), X.max(), 200).reshape(-1, 1)
#        y_fit = model.predict(x_fit)
#        slope = model.coef_[0]
#        intercept = model.intercept_
#        r2 = model.score(X, y)
#        equation_text = f"y = {slope:.5f}x + {intercept:.2f}, R² = {r2:.3f}"
#
#        axes[1].scatter(sun_df["area"], sun_df["duration"], s=10, alpha=0.5, color="lightblue", label="Sunspots")
#
#        # Highlight top 10 in second figure with same colors as Fig 1
#        for idx in topN.index:
#            match = sun_df[sun_df["area"] == topN.loc[idx, "area"]]
#            if not match.empty:
#                axes[1].scatter(match["area"], match["duration"], s=30,
#                                color=color_map[idx], edgecolor="black", label=f"Top {idx}")
#
#        axes[1].plot(x_fit, y_fit, color="red", linewidth=2, label=equation_text)
#        axes[1].set_ylim(0, 100)
#        axes[1].set_xlabel("Max Area (micro-hemispheres)", fontsize=12)
#        axes[1].set_ylabel("Duration (days)", fontsize=12)
#        axes[1].set_title(f"Sunspot Area vs Duration (Solar Cycle {start_year}-{end_year})", fontsize=16)
#        axes[1].legend(fontsize=8)
#    else:
#        axes[1].text(0.5, 0.5, "No valid data", transform=axes[1].transAxes,
#                     ha="center", va="center", fontsize=12, color="red")
#        axes[1].set_title(f"Sunspot Area vs Duration (Solar Cycle {start_year}-{end_year})", fontsize=16)
#
#    # 3) Bar plot of peak areas
#    colors = ["lightgray"] * len(sun_cycle_df)
#    for idx in topN.index:
#        colors[sun_cycle_df.index.get_loc(idx)] = color_map[idx]
#
#    axes[2].bar(sun_cycle_df["days_since_start"], sun_cycle_df["area"],
#                width=20, alpha=0.6, color=colors)
#    axes[2].set_xlabel("Days since start of cycle", fontsize=12)
#    axes[2].set_ylabel("Sunspot Area (micro-hemispheres)", fontsize=12)
#    axes[2].set_title(f"Sunspot Maximum Areas vs Time (Solar Cycle {start_year}-{end_year})", fontsize=16)
#
#    # Save figure
#    filename = os.path.join(output_folder, f"solarcycle_{start_year}-{end_year}.png")
#    plt.savefig(filename, dpi=300)
#    plt.close(fig)
#    print(f"Saved figure for Solar Cycle {start_year}-{end_year} -> {filename}")
#






#import pandas as pd
#import matplotlib.pyplot as plt
#import numpy as np
#from sklearn.linear_model import LinearRegression
#import os
#
## LOAD DATA
#df = pd.read_csv("gpr_1874_1976_corrected.csv")
#
## Convert date/time into datetime
#df["date"] = pd.to_datetime(dict(
#    year=df.year, month=df.month, day=df.day,
#    hour=df.hour, minute=df.minute, second=df.second
#))
#
## SOLAR CYCLES 1879-1976 chosen manually
#solar_cycles = [
#    (1879, 1890), (1890, 1901), (1901, 1912), (1912, 1923),
#    (1923, 1934), (1934, 1944), (1944, 1955), (1955, 1966),
#    (1966, 1977)
#]
#
## Output folders
#integrated_folder = "analysis/solar_cycles_plots"
#butterfly_folder = "analysis/Butterfly_Diagrams"
#regression_folder = "analysis/Regression_Plots"
#bar_folder = "analysis/Bar_Plots"
#
#os.makedirs(integrated_folder, exist_ok=True)
#os.makedirs(butterfly_folder, exist_ok=True)
#os.makedirs(regression_folder, exist_ok=True)
#os.makedirs(bar_folder, exist_ok=True)
#
## LOOP OVER CYCLES
#for start_year, end_year in solar_cycles:
#    cycle_start = pd.Timestamp(f"{start_year}-01-01")
#    cycle_end = pd.Timestamp(f"{end_year}-12-31")
#    df_cycle = df[(df["date"] >= cycle_start) & (df["date"] <= cycle_end)]
#
#    if df_cycle.empty:
#        print(f"No data for cycle {start_year}-{end_year}, skipping...")
#        continue
#
#    # Max area per sunspot group
#    records = []
#    for group_id, g in df_cycle.groupby("group_id"):
#        if g.empty:
#            continue
#        max_area = g["area"].max()
#        peak_row = g[g["area"] == max_area].iloc[0]
#        duration = len(g)
#        records.append((group_id, peak_row["date"], max_area, peak_row["latitude"], duration))
#    sun_cycle_df = pd.DataFrame(records, columns=["group_id", "date", "area", "latitude", "duration"])
#
#    if sun_cycle_df.empty:
#        print(f"No sunspots for cycle {start_year}-{end_year}, skipping...")
#        continue
#
#    sun_cycle_df["days_since_start"] = (sun_cycle_df["date"] - cycle_start).dt.days
#
#    # Butterfly diagram data
#    x_butterfly, lat_butterfly, area_butterfly = [], [], []
#    for _, row in df_cycle.iterrows():
#        if row["area"] >= 50:
#            time_val = (
#                row.date.year + row.date.month / 12 + row.date.day / 365 +
#                row.date.hour / (24 * 365) + row.date.minute / (24 * 365 * 60) + row.date.second / (24 * 365 * 3600)
#            )
#            x_butterfly.append(time_val)
#            lat_butterfly.append(row.latitude)
#            area_butterfly.append(row.area)
#
#    # Pick Top 10 biggest sunspots
#    topN = sun_cycle_df.nlargest(10, "area")
#
#    # Color mapping: bigger area → darker color
#    cmap = plt.cm.inferno_r
#    norm = plt.Normalize(vmin=topN["area"].min(), vmax=topN["area"].max())
#    color_map = {idx: cmap(norm(area)) for idx, area in zip(topN.index, topN["area"])}
#
#    # --- FIGURE 1: Butterfly Diagram ---
#    fig_butterfly, ax_butterfly = plt.subplots(figsize=(14, 10))
#    ax_butterfly.scatter(x_butterfly, lat_butterfly,
#                         s=np.array(area_butterfly) / 50,
#                         c="lightgray", alpha=0.5, label="All Spots")
#
#    for idx in topN.index:
#        spot = topN.loc[idx]
#        ax_butterfly.scatter(
#            spot["date"].year + spot["date"].month / 12 + spot["date"].day / 365,
#            spot["latitude"],
#            s=spot["area"] / 40,
#            color=color_map[idx],
#            edgecolor="black",
#            alpha=0.9,
#            label=f"Group{spot['group_id']} ({spot['date'].date()})"
#        )
#
#    ax_butterfly.set_title(f"Butterfly Diagram (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    ax_butterfly.set_xlabel("Year (fractional)", fontsize=12)
#    ax_butterfly.set_ylabel("Latitude", fontsize=12)
#    ax_butterfly.legend(loc="upper right", fontsize=8)
#
#    butterfly_path = os.path.join(butterfly_folder, f"butterfly_cycle_{start_year}-{end_year}.png")
#    plt.savefig(butterfly_path, dpi=300)
#    plt.close(fig_butterfly)
#
#    # --- FIGURE 2: Regression ---
#    sunspots = []
#    for group_id, g in df_cycle.groupby("group_id"):
#        if g.empty:
#            continue
#        duration = (g["date"].max() - g["date"].min()).days + 1
#        max_area = g["area"].max()
#        if max_area > 0 and duration > 0:
#            sunspots.append((max_area, duration))
#    sun_df = pd.DataFrame(sunspots, columns=["area", "duration"])
#    sun_df = sun_df[(sun_df["area"] > 500) & (sun_df["duration"] > 7) & (sun_df["duration"] <= 100)]
#
#    fig_regression, ax_regression = plt.subplots(figsize=(10, 6))
#    if not sun_df.empty:
#        X = sun_df[["area"]].values
#        y = sun_df["duration"].values
#        model = LinearRegression()
#        model.fit(X, y)
#        x_fit = np.linspace(X.min(), X.max(), 200).reshape(-1, 1)
#        y_fit = model.predict(x_fit)
#        slope = model.coef_[0]
#        intercept = model.intercept_
#        r2 = model.score(X, y)
#        equation_text = f"y = {slope:.5f}x + {intercept:.2f}, R² = {r2:.3f}"
#
#        ax_regression.scatter(sun_df["area"], sun_df["duration"], s=10, alpha=0.5, color="lightblue", label="Sunspots")
#
#        for idx in topN.index:
#            match = sun_df[sun_df["area"] == topN.loc[idx]["area"]]
#            if not match.empty:
#                ax_regression.scatter(match["area"], match["duration"], s=50,
#                                      color=color_map[idx], edgecolor="black",
#                                      label=f"Group{topN.loc[idx]['group_id']} ({topN.loc[idx]['date'].date()})")
#
#        ax_regression.plot(x_fit, y_fit, color="red", linewidth=2, label=equation_text)
#        ax_regression.set_ylim(0, 100)
#        ax_regression.set_xlabel("Max Area (µHem)", fontsize=12)
#        ax_regression.set_ylabel("Duration (days)", fontsize=12)
#        ax_regression.set_title(f"Sunspot Area vs Duration (Solar Cycle {start_year}-{end_year})", fontsize=16)
#        ax_regression.legend(fontsize=8)
#    else:
#        ax_regression.text(0.5, 0.5, "No valid data", transform=ax_regression.transAxes,
#                            ha="center", va="center", fontsize=12, color="red")
#        ax_regression.set_title(f"Sunspot Area vs Duration (Solar Cycle {start_year}-{end_year})", fontsize=16)
#
#    regression_path = os.path.join(regression_folder, f"regression_cycle_{start_year}-{end_year}.png")
#    plt.savefig(regression_path, dpi=300)
#    plt.close(fig_regression)
#
#    # --- FIGURE 3: Bar Plot ---
#    fig_bar, ax_bar = plt.subplots(figsize=(14, 10))
#    colors = ["lightgray"] * len(sun_cycle_df)
#    for idx in topN.index:
#        colors[sun_cycle_df.index.get_loc(idx)] = color_map[idx]
#
#    bars = ax_bar.bar(sun_cycle_df["days_since_start"], sun_cycle_df["area"],
#                      width=20, alpha=0.6, color=colors)
#
#    # Add legend for top sunspots
#    handles = [plt.Line2D([0], [0], marker='o', color='w',
#                          markerfacecolor=color_map[idx], markersize=10,
#                          label=f"Group{topN.loc[idx]['group_id']} ({topN.loc[idx]['date'].date()})")
#               for idx in topN.index]
#    ax_bar.legend(handles=handles, fontsize=8, loc="upper right")
#
#    ax_bar.set_xlabel("Days since start of cycle", fontsize=12)
#    ax_bar.set_ylabel("Sunspot Area (µHem)", fontsize=12)
#    ax_bar.set_title(f"Sunspot Maximum Areas vs Time (Solar Cycle {start_year}-{end_year})", fontsize=16)
#
#    bar_path = os.path.join(bar_folder, f"bar_cycle_{start_year}-{end_year}.png")
#    plt.savefig(bar_path, dpi=300)
#    plt.close(fig_bar)
#
#    # --- INTEGRATED FIGURE ---
#    fig_integrated, axes = plt.subplots(3, 1, figsize=(14, 20), constrained_layout=True)
#
#    # Butterfly diagram
#    axes[0].scatter(x_butterfly, lat_butterfly,
#                    s=np.array(area_butterfly) / 50,
#                    c="lightgray", alpha=0.5, label="All Spots")
#    for idx in topN.index:
#        spot = topN.loc[idx]
#        axes[0].scatter(
#            spot["date"].year + spot["date"].month / 12 + spot["date"].day / 365,
#            spot["latitude"],
#            s=spot["area"] / 40,
#            color=color_map[idx],
#            edgecolor="black",
#            alpha=0.9,
#            label=f"Group{spot['group_id']} ({spot['date'].date()})"
#        )
#    axes[0].set_title(f"Butterfly Diagram (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    axes[0].set_xlabel("Year (fractional)", fontsize=12)
#    axes[0].set_ylabel("Latitude", fontsize=12)
#    axes[0].legend(fontsize=8)
#
#    # Regression
#    if not sun_df.empty:
#        axes[1].scatter(sun_df["area"], sun_df["duration"], s=10, alpha=0.5, color="lightblue", label="Sunspots")
#        for idx in topN.index:
#            match = sun_df[sun_df["area"] == topN.loc[idx]["area"]]
#            if not match.empty:
#                axes[1].scatter(match["area"], match["duration"], s=50,
#                                color=color_map[idx], edgecolor="black",
#                                label=f"Group{topN.loc[idx]['group_id']} ({topN.loc[idx]['date'].date()})")
#        axes[1].plot(x_fit, y_fit, color="red", linewidth=2, label=equation_text)
#        axes[1].set_ylim(0, 100)
#        axes[1].set_xlabel("Max Area (µHem)", fontsize=12)
#        axes[1].set_ylabel("Duration (days)", fontsize=12)
#    axes[1].set_title(f"Sunspot Area vs Duration (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    axes[1].legend(fontsize=8)
#
#    # Bar plot
#    axes[2].bar(sun_cycle_df["days_since_start"], sun_cycle_df["area"],
#                width=20, alpha=0.6, color=colors)
#    axes[2].set_xlabel("Days since start of cycle", fontsize=12)
#    axes[2].set_ylabel("Sunspot Area (µHem)", fontsize=12)
#    axes[2].set_title(f"Sunspot Maximum Areas vs Time (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    axes[2].legend(handles=handles, fontsize=8, loc="upper right")
#
#    integrated_path = os.path.join(integrated_folder, f"solar_cycle_{start_year}-{end_year}.png")
#    plt.savefig(integrated_path, dpi=300)
#    plt.close(fig_integrated)
#    print(f"Saved Integrated Figure -> {integrated_path}")
#


#import pandas as pd
#import matplotlib.pyplot as plt
#import numpy as np
#from sklearn.linear_model import LinearRegression
#import os
#
## LOAD DATA
#df = pd.read_csv("gpr_1874_1976_corrected.csv")
#
## Convert date/time into datetime
#df["date"] = pd.to_datetime(dict(
#    year=df.year, month=df.month, day=df.day,
#    hour=df.hour, minute=df.minute, second=df.second
#))
#
## SOLAR CYCLES 1879-1976 chosen manually
#solar_cycles = [
#    (1879, 1890), (1890, 1901), (1901, 1912), (1912, 1923),
#    (1923, 1934), (1934, 1944), (1944, 1955), (1955, 1966),
#    (1966, 1977)
#]
#
## Output folders
#integrated_folder = "analysis/solar_cycles_plots"
#butterfly_folder = "analysis/Butterfly_Diagrams"
#regression_folder = "analysis/Regression_Plots"
#bar_folder = "analysis/Bar_Plots"
#
#os.makedirs(integrated_folder, exist_ok=True)
#os.makedirs(butterfly_folder, exist_ok=True)
#os.makedirs(regression_folder, exist_ok=True)
#os.makedirs(bar_folder, exist_ok=True)
#
## LOOP OVER CYCLES
#for start_year, end_year in solar_cycles:
#    cycle_start = pd.Timestamp(f"{start_year}-01-01")
#    cycle_end = pd.Timestamp(f"{end_year}-12-31")
#    df_cycle = df[(df["date"] >= cycle_start) & (df["date"] <= cycle_end)]
#
#    if df_cycle.empty:
#        print(f"No data for cycle {start_year}-{end_year}, skipping...")
#        continue
#
#    # Max area per sunspot group
#    records = []
#    for group_id, g in df_cycle.groupby("group_id"):
#        if g.empty:
#            continue
#        max_area = g["area"].max()
#        peak_row = g[g["area"] == max_area].iloc[0]
#        duration = len(g)
#        records.append((group_id, peak_row["date"], max_area, peak_row["latitude"], duration))
#    sun_cycle_df = pd.DataFrame(records, columns=["group_id", "date", "area", "latitude", "duration"])
#
#    if sun_cycle_df.empty:
#        print(f"No sunspots for cycle {start_year}-{end_year}, skipping...")
#        continue
#
#    sun_cycle_df["days_since_start"] = (sun_cycle_df["date"] - cycle_start).dt.days
#
#    # Butterfly diagram data
#    x_butterfly, lat_butterfly, area_butterfly = [], [], []
#    for _, row in df_cycle.iterrows():
#        if row["area"] >= 50:
#            time_val = (
#                row.date.year + row.date.month / 12 + row.date.day / 365 +
#                row.date.hour / (24 * 365) + row.date.minute / (24 * 365 * 60) + row.date.second / (24 * 365 * 3600)
#            )
#            x_butterfly.append(time_val)
#            lat_butterfly.append(row.latitude)
#            area_butterfly.append(row.area)
#
#    # Pick Top 10 biggest sunspots
#    topN = sun_cycle_df.nlargest(10, "area")
#
#    # Color mapping: bigger area → darker color
#    cmap = plt.cm.inferno_r
#    norm = plt.Normalize(vmin=topN["area"].min(), vmax=topN["area"].max())
#    color_map = {idx: cmap(norm(area)) for idx, area in zip(topN.index, topN["area"])}
#
#    # --- FIGURE 1: Butterfly Diagram ---
#    fig_butterfly, ax_butterfly = plt.subplots(figsize=(14, 10))
#    ax_butterfly.scatter(x_butterfly, lat_butterfly,
#                         s=np.array(area_butterfly) / 50,
#                         color="lightblue", alpha=0.5, label="All Spots")
#
#    for idx in topN.index:
#        spot = topN.loc[idx]
#        ax_butterfly.scatter(
#            spot["date"].year + spot["date"].month / 12 + spot["date"].day / 365,
#            spot["latitude"],
#            s=spot["area"] / 40,
#            color=color_map[idx],
#            edgecolor="black",
#            alpha=0.9,
#            label=f"Group{spot['group_id']} ({spot['date'].date()})"
#        )
#
#    ax_butterfly.set_title(f"Butterfly Diagram (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    ax_butterfly.set_xlabel("Year (fractional)", fontsize=12)
#    ax_butterfly.set_ylabel("Latitude", fontsize=12)
#    ax_butterfly.legend(loc="upper right", fontsize=8)
#
#    # Save Butterfly figure
#    butterfly_path = os.path.join(butterfly_folder, f"butterfly_cycle_{start_year}-{end_year}.png")
#    plt.savefig(butterfly_path, dpi=300)
#    plt.close(fig_butterfly)
#
#    # --- FIGURE 2: Regression ---
#    sunspots = []
#    for group_id, g in df_cycle.groupby("group_id"):
#        if g.empty:
#            continue
#        duration = (g["date"].max() - g["date"].min()).days + 1
#        max_area = g["area"].max()
#        if max_area > 0 and duration > 0:
#            sunspots.append((max_area, duration))
#    sun_df = pd.DataFrame(sunspots, columns=["area", "duration"])
#    sun_df = sun_df[(sun_df["area"] > 500) & (sun_df["duration"] > 7) & (sun_df["duration"] <= 100)]
#
#    fig_regression, ax_regression = plt.subplots(figsize=(10, 6))
#    if not sun_df.empty:
#        X = sun_df[["area"]].values
#        y = sun_df["duration"].values
#        model = LinearRegression()
#        model.fit(X, y)
#        x_fit = np.linspace(X.min(), X.max(), 200).reshape(-1, 1)
#        y_fit = model.predict(x_fit)
#        slope = model.coef_[0]
#        intercept = model.intercept_
#        r2 = model.score(X, y)
#        equation_text = f"y = {slope:.5f}x + {intercept:.2f}, R² = {r2:.3f}"
#
#        ax_regression.scatter(sun_df["area"], sun_df["duration"], s=10, alpha=0.5, color="lightblue", label="Sunspots")
#
#        for idx in topN.index:
#            match = sun_df[sun_df["area"] == topN.loc[idx]["area"]]
#            if not match.empty:
#                ax_regression.scatter(match["area"], match["duration"], s=50,
#                                      color=color_map[idx], edgecolor="black",
#                                      label=f"Group{topN.loc[idx]['group_id']} ({topN.loc[idx]['date'].date()})")
#
#        ax_regression.plot(x_fit, y_fit, color="red", linewidth=2, label=equation_text)
#        ax_regression.set_ylim(0, 100)
#        ax_regression.set_xlabel("Max Area (µHem)", fontsize=12)
#        ax_regression.set_ylabel("Duration (days)", fontsize=12)
#        ax_regression.set_title(f"Sunspot Area vs Duration (Solar Cycle {start_year}-{end_year})", fontsize=16)
#        ax_regression.legend(fontsize=8)
#    else:
#        ax_regression.text(0.5, 0.5, "No valid data", transform=ax_regression.transAxes,
#                            ha="center", va="center", fontsize=12, color="red")
#
#    regression_path = os.path.join(regression_folder, f"regression_cycle_{start_year}-{end_year}.png")
#    plt.savefig(regression_path, dpi=300)
#    plt.close(fig_regression)
#
#    # --- FIGURE 3: Bar Plot ---
#    fig_bar, ax_bar = plt.subplots(figsize=(14, 10))
#    colors = ["lightgray"] * len(sun_cycle_df)
#    for idx in topN.index:
#        colors[sun_cycle_df.index.get_loc(idx)] = color_map[idx]
#
#    bars = ax_bar.bar(sun_cycle_df["days_since_start"], sun_cycle_df["area"],
#                      width=20, alpha=0.6, color=colors)
#
#    # Legend for top sunspots
#    handles = [plt.Line2D([0], [0], marker='o', color='w',
#                          markerfacecolor=color_map[idx], markersize=10,
#                          label=f"Group{topN.loc[idx]['group_id']} ({topN.loc[idx]['date'].date()})")
#               for idx in topN.index]
#    ax_bar.legend(handles=handles, fontsize=8, loc="upper right")
#
#    ax_bar.set_xlabel("Days since start of cycle", fontsize=12)
#    ax_bar.set_ylabel("Sunspot Area (µHem)", fontsize=12)
#    ax_bar.set_title(f"Sunspot Maximum Areas vs Time (Solar Cycle {start_year}-{end_year})", fontsize=16)
#
#    bar_path = os.path.join(bar_folder, f"bar_cycle_{start_year}-{end_year}.png")
#    plt.savefig(bar_path, dpi=300)
#    plt.close(fig_bar)
#
#    # --- INTEGRATED FIGURE ---
#    fig_integrated, axes = plt.subplots(3, 1, figsize=(14, 20), constrained_layout=True)
#
#    # Butterfly diagram with light blue base
#    axes[0].scatter(x_butterfly, lat_butterfly,
#                    s=np.array(area_butterfly) / 50,
#                    color="lightblue", alpha=0.5, label="All Spots")
#    for idx in topN.index:
#        spot = topN.loc[idx]
#        axes[0].scatter(
#            spot["date"].year + spot["date"].month / 12 + spot["date"].day / 365,
#            spot["latitude"],
#            s=spot["area"] / 40,
#            color=color_map[idx],
#            edgecolor="black",
#            alpha=0.9,
#            label=f"Group{spot['group_id']} ({spot['date'].date()})"
#        )
#    axes[0].set_title(f"Butterfly Diagram (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    axes[0].set_xlabel("Year (fractional)", fontsize=12)
#    axes[0].set_ylabel("Latitude", fontsize=12)
#    axes[0].legend(fontsize=8)
#
#    # Add colorbar illustrating area
#    sm = plt.cm.ScalarMappable(cmap=cmap, norm=norm)
#    sm.set_array([])
#    cbar = fig_integrated.colorbar(sm, ax=axes[0])
#    cbar.set_label('Sunspot Area (µHem)', fontsize=12)
#
#    # Regression
#    if not sun_df.empty:
#        axes[1].scatter(sun_df["area"], sun_df["duration"], s=10, alpha=0.5, color="lightblue", label="Sunspots")
#        for idx in topN.index:
#            match = sun_df[sun_df["area"] == topN.loc[idx]["area"]]
#            if not match.empty:
#                axes[1].scatter(match["area"], match["duration"], s=50,
#                                color=color_map[idx], edgecolor="black",
#                                label=f"Group{topN.loc[idx]['group_id']} ({topN.loc[idx]['date'].date()})")
#        axes[1].plot(x_fit, y_fit, color="red", linewidth=2, label=equation_text)
#        axes[1].set_ylim(0, 100)
#        axes[1].set_xlabel("Max Area (µHem)", fontsize=12)
#        axes[1].set_ylabel("Duration (days)", fontsize=12)
#    axes[1].set_title(f"Sunspot Area vs Duration (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    axes[1].legend(fontsize=8)
#
#    # Bar plot
#    axes[2].bar(sun_cycle_df["days_since_start"], sun_cycle_df["area"],
#                width=20, alpha=0.6, color=colors)
#    axes[2].set_xlabel("Days since start of cycle", fontsize=12)
#    axes[2].set_ylabel("Sunspot Area (µHem)", fontsize=12)
#    axes[2].set_title(f"Sunspot Maximum Areas vs Time (Solar Cycle {start_year}-{end_year})", fontsize=16)
#    axes[2].legend(handles=handles, fontsize=8, loc="upper right")
#
#    integrated_path = os.path.join(integrated_folder, f"solar_cycle_{start_year}-{end_year}.png")
#    plt.savefig(integrated_path, dpi=300)
#    plt.close(fig_integrated)
#    print(f"Saved Integrated Figure -> {integrated_path}")
#



import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from sklearn.linear_model import LinearRegression
import os

# LOAD DATA
df = pd.read_csv("gpr_1874_1976_corrected.csv")

# Convert date/time into datetime
df["date"] = pd.to_datetime(dict(
    year=df.year, month=df.month, day=df.day,
    hour=df.hour, minute=df.minute, second=df.second
))

# SOLAR CYCLES 1879-1976 chosen manually
solar_cycles = [
    (1879, 1890), (1890, 1901), (1901, 1912), (1912, 1923),
    (1923, 1934), (1934, 1944), (1944, 1955), (1955, 1966),
    (1966, 1977)
]

# Output folders
integrated_folder = "analysis/solar_cycles_plots"
butterfly_folder = "analysis/Butterfly_Diagrams"
regression_folder = "analysis/Regression_Plots"
bar_folder = "analysis/Bar_Plots"

os.makedirs(integrated_folder, exist_ok=True)
os.makedirs(butterfly_folder, exist_ok=True)
os.makedirs(regression_folder, exist_ok=True)
os.makedirs(bar_folder, exist_ok=True)

# LOOP OVER CYCLES
for start_year, end_year in solar_cycles:
    cycle_start = pd.Timestamp(f"{start_year}-01-01")
    cycle_end = pd.Timestamp(f"{end_year}-12-31")
    df_cycle = df[(df["date"] >= cycle_start) & (df["date"] <= cycle_end)]

    if df_cycle.empty:
        print(f"No data for cycle {start_year}-{end_year}, skipping...")
        continue

    # Max area per sunspot group
    records = []
    for group_id, g in df_cycle.groupby("group_id"):
        if g.empty:
            continue
        max_area = g["area"].max()
        peak_row = g[g["area"] == max_area].iloc[0]
        duration = len(g)
        records.append((group_id, peak_row["date"], max_area, peak_row["latitude"], duration))
    sun_cycle_df = pd.DataFrame(records, columns=["group_id", "date", "area", "latitude", "duration"])

    if sun_cycle_df.empty:
        print(f"No sunspots for cycle {start_year}-{end_year}, skipping...")
        continue

    sun_cycle_df["days_since_start"] = (sun_cycle_df["date"] - cycle_start).dt.days

    # Butterfly diagram data
    x_butterfly, lat_butterfly, area_butterfly = [], [], []
    for _, row in df_cycle.iterrows():
        if row["area"] >= 50:
            time_val = (
                row.date.year + row.date.month / 12 + row.date.day / 365 +
                row.date.hour / (24 * 365) + row.date.minute / (24 * 365 * 60) + row.date.second / (24 * 365 * 3600)
            )
            x_butterfly.append(time_val)
            lat_butterfly.append(row.latitude)
            area_butterfly.append(row.area)

    # Pick Top 10 biggest sunspots
    topN = sun_cycle_df.nlargest(10, "area")

    # Color mapping: bigger area → darker color
    cmap = plt.cm.inferno_r
    norm = plt.Normalize(vmin=topN["area"].min(), vmax=topN["area"].max())
    color_map = {idx: cmap(norm(area)) for idx, area in zip(topN.index, topN["area"])}

    # --- FIGURE 1: Butterfly Diagram ---
    fig_butterfly, ax_butterfly = plt.subplots(figsize=(14, 10))
    ax_butterfly.scatter(x_butterfly, lat_butterfly,
                         s=np.array(area_butterfly) / 50,
                         color="lightblue", alpha=0.5, label="All Spots")

    for idx in topN.index:
        spot = topN.loc[idx]
        ax_butterfly.scatter(
            spot["date"].year + spot["date"].month / 12 + spot["date"].day / 365,
            spot["latitude"],
            s=spot["area"] / 40,
            color=color_map[idx],
            edgecolor="black",
            alpha=0.9,
            label=f"Group{spot['group_id']} ({spot['date'].date()})"
        )

    ax_butterfly.set_title(f"Butterfly Diagram (Solar Cycle {start_year}-{end_year})", fontsize=16)
    ax_butterfly.set_xlabel("Year (fractional)", fontsize=12)
    ax_butterfly.set_ylabel("Latitude", fontsize=12)
    ax_butterfly.legend(fontsize=8)

    sm = plt.cm.ScalarMappable(cmap=cmap, norm=norm)
    sm.set_array([])
    cbar = fig_butterfly.colorbar(sm, ax=ax_butterfly)
    cbar.set_label('Sunspot Area (µHem)', fontsize=12)

    butterfly_path = os.path.join(butterfly_folder, f"butterfly_cycle_{start_year}-{end_year}.png")
    plt.savefig(butterfly_path, dpi=300)
    plt.close(fig_butterfly)

    # --- FIGURE 2: Regression ---
    sunspots = []
    for group_id, g in df_cycle.groupby("group_id"):
        if g.empty:
            continue
        duration = (g["date"].max() - g["date"].min()).days + 1
        max_area = g["area"].max()
        if max_area > 0 and duration > 0:
            sunspots.append((max_area, duration))
    sun_df = pd.DataFrame(sunspots, columns=["area", "duration"])
    sun_df = sun_df[(sun_df["area"] > 500) & (sun_df["duration"] > 7) & (sun_df["duration"] <= 100)]

    fig_regression, ax_regression = plt.subplots(figsize=(10, 6))
    if not sun_df.empty:
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

        ax_regression.scatter(sun_df["area"], sun_df["duration"], s=10, alpha=0.5, color="lightblue", label="Sunspots")

        for idx in topN.index:
            match = sun_df[sun_df["area"] == topN.loc[idx]["area"]]
            if not match.empty:
                ax_regression.scatter(match["area"], match["duration"], s=50,
                                      color=color_map[idx], edgecolor="black",
                                      label=f"Group{topN.loc[idx]['group_id']} ({topN.loc[idx]['date'].date()})")

        ax_regression.plot(x_fit, y_fit, color="red", linewidth=2, label=equation_text)
        ax_regression.set_ylim(0, 100)
        ax_regression.set_xlabel("Max Area (µHem)", fontsize=12)
        ax_regression.set_ylabel("Duration (days)", fontsize=12)
        ax_regression.set_title(f"Sunspot Area vs Duration (Solar Cycle {start_year}-{end_year})", fontsize=16)
        ax_regression.legend(fontsize=8)

    sm = plt.cm.ScalarMappable(cmap=cmap, norm=norm)
    sm.set_array([])
    cbar = fig_regression.colorbar(sm, ax=ax_regression)
    cbar.set_label('Sunspot Area (µHem)', fontsize=12)

    regression_path = os.path.join(regression_folder, f"regression_cycle_{start_year}-{end_year}.png")
    plt.savefig(regression_path, dpi=300)
    plt.close(fig_regression)

    # --- FIGURE 3: Bar Plot ---
    fig_bar, ax_bar = plt.subplots(figsize=(14, 10))
    colors = ["lightgray"] * len(sun_cycle_df)
    for idx in topN.index:
        colors[sun_cycle_df.index.get_loc(idx)] = color_map[idx]

    ax_bar.bar(sun_cycle_df["days_since_start"], sun_cycle_df["area"],
               width=20, alpha=0.6, color=colors)

    ax_bar.set_xlabel("Days since start of cycle", fontsize=12)
    ax_bar.set_ylabel("Sunspot Area (µHem)", fontsize=12)
    ax_bar.set_title(f"Sunspot Maximum Areas vs Time (Solar Cycle {start_year}-{end_year})", fontsize=16)

    sm = plt.cm.ScalarMappable(cmap=cmap, norm=norm)
    sm.set_array([])
    cbar = fig_bar.colorbar(sm, ax=ax_bar)
    cbar.set_label('Sunspot Area (µHem)', fontsize=12)

    bar_path = os.path.join(bar_folder, f"bar_cycle_{start_year}-{end_year}.png")
    plt.savefig(bar_path, dpi=300)
    plt.close(fig_bar)

    # --- INTEGRATED FIGURE ---
    fig_integrated, axes = plt.subplots(3, 1, figsize=(14, 20), constrained_layout=True)

    axes[0].scatter(x_butterfly, lat_butterfly,
                    s=np.array(area_butterfly) / 50,
                    color="lightblue", alpha=0.5, label="All Spots")
    for idx in topN.index:
        spot = topN.loc[idx]
        axes[0].scatter(
            spot["date"].year + spot["date"].month / 12 + spot["date"].day / 365,
            spot["latitude"],
            s=spot["area"] / 40,
            color=color_map[idx],
            edgecolor="black",
            alpha=0.9,
            label=f"Group{spot['group_id']} ({spot['date'].date()})"
        )
    axes[0].set_title(f"Butterfly Diagram (Solar Cycle {start_year}-{end_year})", fontsize=16)
    axes[0].set_xlabel("Year (fractional)", fontsize=12)
    axes[0].set_ylabel("Latitude", fontsize=12)
    axes[0].legend(fontsize=8)

    sm = plt.cm.ScalarMappable(cmap=cmap, norm=norm)
    sm.set_array([])
    fig_integrated.colorbar(sm, ax=axes[0], label="Sunspot Area (µHem)")

    if not sun_df.empty:
        axes[1].scatter(sun_df["area"], sun_df["duration"], s=10, alpha=0.5, color="lightblue", label="Sunspots")
        for idx in topN.index:
            match = sun_df[sun_df["area"] == topN.loc[idx]["area"]]
            if not match.empty:
                axes[1].scatter(match["area"], match["duration"], s=50,
                                color=color_map[idx], edgecolor="black",
                                label=f"Group{topN.loc[idx]['group_id']} ({topN.loc[idx]['date'].date()})")
        axes[1].plot(x_fit, y_fit, color="red", linewidth=2, label=equation_text)
        axes[1].set_ylim(0, 100)
        axes[1].set_xlabel("Max Area (µHem)", fontsize=12)
        axes[1].set_ylabel("Duration (days)", fontsize=12)
    axes[1].set_title(f"Sunspot Area vs Duration (Solar Cycle {start_year}-{end_year})", fontsize=16)
    axes[1].legend(fontsize=8)

    fig_integrated.colorbar(sm, ax=axes[1], label="Sunspot Area (µHem)")

    axes[2].bar(sun_cycle_df["days_since_start"], sun_cycle_df["area"],
                width=20, alpha=0.6, color=colors)
    axes[2].set_xlabel("Days since start of cycle", fontsize=12)
    axes[2].set_ylabel("Sunspot Area (µHem)", fontsize=12)
    axes[2].set_title(f"Sunspot Maximum Areas vs Time (Solar Cycle {start_year}-{end_year})", fontsize=16)

    fig_integrated.colorbar(sm, ax=axes[2], label="Sunspot Area (µHem)")

    integrated_path = os.path.join(integrated_folder, f"solar_cycle_{start_year}-{end_year}.png")
    plt.savefig(integrated_path, dpi=300)
    plt.close(fig_integrated)

    print(f"Saved figures for cycle {start_year}-{end_year}")
