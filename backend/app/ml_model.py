from sklearn.ensemble import IsolationForest
import numpy as np
import pandas as pd
import joblib
import os

class ThreatPredictor:
    def __init__(self):
        self.model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        self.is_trained = False
        self.model_path = os.path.join(os.path.dirname(__file__), "isolation_forest.pkl")
        self._load_or_train()

    def _load_or_train(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            self.is_trained = True
        else:
            # Train with baseline normal data. 
            # In a real environment, this is trained on real benign network logs.
            np.random.seed(42)
            dummy_data = {
                'packet_count': np.random.randint(1, 50, 1000),
                'total_bytes': np.random.randint(40, 15000, 1000),
                'duration': np.random.uniform(0.1, 10.0, 1000)
            }
            df = pd.DataFrame(dummy_data)
            self.model.fit(df)
            joblib.dump(self.model, self.model_path)
            self.is_trained = True

    def predict(self, packet_count: int, total_bytes: int, duration: float) -> bool:
        """Returns True if anomaly detected."""
        if not self.is_trained:
            return False 
        
        features = pd.DataFrame([[packet_count, total_bytes, duration]], columns=['packet_count', 'total_bytes', 'duration'])
        prediction = self.model.predict(features)[0]
        # Returns -1 for anomaly and 1 for normal
        return prediction == -1
