#lat/time scatter plot

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
df=pd.read_csv("gpr_1874_1976_corrected.csv")
year=df["year"].to_list()
month=df["month"].to_list()
day=df["day"].to_list()
hour=df["hour"].to_list()
minute=df["minute"].to_list()
second=df["second"].to_list()
area=df["area"].to_list()
latitude=df["latitude"].to_list()
x=[]
lat=[]
colors=[]
for y,mo,d,h,mi,s,a,l in zip(year,month,day,hour,minute,second,area,latitude):
    if a>=50:
        time_val=y+mo/12+d/365+h/(24*365)+mi/(24*365*60)+s/(24*365*3600)
        x.append(time_val)
        lat.append(l)
        colors.append(l)
x = np.array(x)
lat = np.array(lat)
colors = np.array(colors)
sizes = 5+15*(np.array(area)[:len(colors)]-50)/(max(area)-50)
plt.figure(figsize=(12,6))
scatter = plt.scatter(
    x,lat,c=colors,s=sizes,
    cmap='plasma',alpha=0.8,edgecolors='none'
)
plt.colorbar(scatter, label='Latitude')
plt.title("Butterfly Diagram (Solar Cycle 1874-1976)")
plt.xlabel("Year (fractional)")
plt.ylabel("Latitude")
plt.grid(alpha=0.3)
plt.savefig("analysis/butterfly_diagram.png", dpi=300)
