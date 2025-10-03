#run in colab
#mount drive

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
import matplotlib.pyplot as plt
df = pd.read_csv("gpr_1874_1976_corrected.csv")
df["date"] = pd.to_datetime(dict(
    year=df.year, month=df.month, day=df.day,
    hour=df.hour, minute=df.minute, second=df.second
))
df = df.dropna(subset=["latitude", "longitude", "area"])
grouped = df.groupby("group_id")
top_spots = grouped["area"].max().nlargest(20).index
df_top = df[df["group_id"].isin(top_spots)]
print(f"Selected {len(top_spots)} groups for model training.")
df_top["time_sec"] = (df_top["date"] - df_top["date"].min()).dt.total_seconds()
df_top["duration"] = grouped["date"].transform(lambda x: (x.max() - x.min()).days + 1)
X = df_top[["latitude", "time_sec", "area", "duration"]].values
longitude_rad = np.deg2rad(df_top["longitude"].values)
y = np.column_stack((np.sin(longitude_rad), np.cos(longitude_rad)))
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(X.shape[1],)),
    tf.keras.layers.Dense(128, activation="relu"),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(128, activation="relu"),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(64, activation="relu"),
    tf.keras.layers.Dense(2, activation="linear")
])
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001), loss="mse")
history = model.fit(X_train, y_train, epochs=100, batch_size=32, validation_split=0.2)
test_loss = model.evaluate(X_test, y_test)
print(f"Test loss: {test_loss:.4f}")
y_pred = model.predict(X_test)
pred_lon_rad = np.arctan2(y_pred[:,0], y_pred[:,1])
pred_lon_deg = np.rad2deg(pred_lon_rad) % 360
true_lon_rad = np.arctan2(y_test[:,0], y_test[:,1])
true_lon_deg = np.rad2deg(true_lon_rad) % 360
plt.figure(figsize=(8,6))
plt.scatter(true_lon_deg, pred_lon_deg, alpha=0.6, color="royalblue")
plt.plot([0, 360], [0, 360], "r--")
plt.xlabel("True Longitude (°)")
plt.ylabel("Predicted Longitude (°)")
plt.title("Cyclic Longitude Prediction — Top 20 Sunspots")
plt.xlim(0, 360)
plt.ylim(0, 360)
plt.savefig("analysis/true_vs_predicted_longitude.png")
plt.figure(figsize=(8,6))
plt.plot(history.history["loss"], label="Train loss")
plt.plot(history.history["val_loss"], label="Validation loss")
plt.xlabel("Epoch")
plt.ylabel("Loss (MSE)")
plt.legend()
plt.title("Training Loss")
plt.savefig("analysis/training_loss.png")