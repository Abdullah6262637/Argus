"""Data Science Tools - FAZ 3
Veri analizi, görselleştirme, istatistik ve ML araçları.
Pandas, Matplotlib, Seaborn, Scikit-learn entegrasyonları.
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from app.services.tools.base import BaseTool, PermissionKey, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class PandasReadCSVTool(BaseTool):
    """CSV dosyasını oku ve analiz et."""
    name = "pandas_read_csv"
    description = "CSV dosyasını okur ve temel istatistikleri gösterir."
    permission: PermissionKey = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {"type": "string", "description": "CSV dosya yolu"},
            "show_head": {"type": "boolean", "description": "İlk satırları göster (varsayılan: true)"}
        },
        "required": ["file_path"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import pandas as pd
            file_path = args.get("file_path")
            df = pd.read_csv(file_path)
            output = f"CSV yüklendi: {len(df)} satır, {len(df.columns)} sütun\n\nSütunlar: {', '.join(df.columns)}\n\nİlk 5 satır:\n{df.head()}"
            return ToolResult(ok=True, output=output, data={"shape": df.shape, "columns": list(df.columns)})
        except ImportError:
            return ToolResult(ok=False, error="pandas yüklü değil: pip install pandas")
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class PandasDescribeTool(BaseTool):
    """Veri istatistiklerini göster."""
    name = "pandas_describe"
    description = "Veri setinin istatistiksel özetini gösterir."
    permission: PermissionKey = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {"type": "string", "description": "CSV dosya yolu"}
        },
        "required": ["file_path"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import pandas as pd
            df = pd.read_csv(args.get("file_path"))
            output = f"İstatistiksel Özet:\n\n{df.describe()}"
            return ToolResult(ok=True, output=output, data={"stats": df.describe().to_dict()})
        except ImportError:
            return ToolResult(ok=False, error="pandas yüklü değil")
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class MatplotlibLineChartTool(BaseTool):
    """Çizgi grafik oluştur."""
    name = "matplotlib_line_chart"
    description = "Veri için çizgi grafik oluşturur ve kaydeder."
    permission: PermissionKey = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {"type": "string", "description": "CSV dosya yolu"},
            "x_column": {"type": "string", "description": "X ekseni sütunu"},
            "y_column": {"type": "string", "description": "Y ekseni sütunu"},
            "output_path": {"type": "string", "description": "Çıktı PNG yolu"}
        },
        "required": ["file_path", "x_column", "y_column", "output_path"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import pandas as pd
            import matplotlib.pyplot as plt
            df = pd.read_csv(args.get("file_path"))
            plt.figure(figsize=(10, 6))
            plt.plot(df[args.get("x_column")], df[args.get("y_column")])
            plt.xlabel(args.get("x_column"))
            plt.ylabel(args.get("y_column"))
            plt.title(f"{args.get('y_column')} vs {args.get('x_column')}")
            plt.savefig(args.get("output_path"))
            plt.close()
            return ToolResult(ok=True, output=f"Grafik kaydedildi: {args.get('output_path')}")
        except ImportError:
            return ToolResult(ok=False, error="matplotlib yüklü değil: pip install matplotlib")
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class MatplotlibBarChartTool(BaseTool):
    """Bar grafik oluştur."""
    name = "matplotlib_bar_chart"
    description = "Bar grafik oluşturur."
    permission: PermissionKey = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {"type": "string"},
            "x_column": {"type": "string"},
            "y_column": {"type": "string"},
            "output_path": {"type": "string"}
        },
        "required": ["file_path", "x_column", "y_column", "output_path"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import pandas as pd
            import matplotlib.pyplot as plt
            df = pd.read_csv(args.get("file_path"))
            plt.figure(figsize=(10, 6))
            plt.bar(df[args.get("x_column")], df[args.get("y_column")])
            plt.xlabel(args.get("x_column"))
            plt.ylabel(args.get("y_column"))
            plt.savefig(args.get("output_path"))
            plt.close()
            return ToolResult(ok=True, output=f"Bar grafik kaydedildi: {args.get('output_path')}")
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class MatplotlibScatterPlotTool(BaseTool):
    """Scatter plot oluştur."""
    name = "matplotlib_scatter_plot"
    description = "Scatter plot oluşturur."
    permission: PermissionKey = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {"type": "string"},
            "x_column": {"type": "string"},
            "y_column": {"type": "string"},
            "output_path": {"type": "string"}
        },
        "required": ["file_path", "x_column", "y_column", "output_path"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import pandas as pd
            import matplotlib.pyplot as plt
            df = pd.read_csv(args.get("file_path"))
            plt.figure(figsize=(10, 6))
            plt.scatter(df[args.get("x_column")], df[args.get("y_column")])
            plt.xlabel(args.get("x_column"))
            plt.ylabel(args.get("y_column"))
            plt.savefig(args.get("output_path"))
            plt.close()
            return ToolResult(ok=True, output=f"Scatter plot kaydedildi: {args.get('output_path')}")
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class LinearRegressionTool(BaseTool):
    """Lineer regresyon analizi."""
    name = "linear_regression"
    description = "Lineer regresyon modeli oluşturur ve tahmin yapar."
    permission: PermissionKey = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {"type": "string"},
            "feature_columns": {"type": "array", "items": {"type": "string"}},
            "target_column": {"type": "string"}
        },
        "required": ["file_path", "feature_columns", "target_column"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import pandas as pd
            from sklearn.linear_model import LinearRegression
            from sklearn.model_selection import train_test_split
            from sklearn.metrics import r2_score, mean_squared_error
            
            df = pd.read_csv(args.get("file_path"))
            X = df[args.get("feature_columns")]
            y = df[args.get("target_column")]
            
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            model = LinearRegression()
            model.fit(X_train, y_train)
            
            y_pred = model.predict(X_test)
            r2 = r2_score(y_test, y_pred)
            mse = mean_squared_error(y_test, y_pred)
            
            output = f"Lineer Regresyon Sonuçları:\n\nR² Score: {r2:.4f}\nMSE: {mse:.4f}\n\nKatsayılar: {dict(zip(args.get('feature_columns'), model.coef_))}"
            return ToolResult(ok=True, output=output, data={"r2": r2, "mse": mse, "coefficients": list(model.coef_)})
        except ImportError:
            return ToolResult(ok=False, error="scikit-learn yüklü değil: pip install scikit-learn")
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class KMeansClusteringTool(BaseTool):
    """K-Means kümeleme."""
    name = "kmeans_clustering"
    description = "K-Means kümeleme algoritması uygular."
    permission: PermissionKey = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {"type": "string"},
            "feature_columns": {"type": "array", "items": {"type": "string"}},
            "n_clusters": {"type": "integer", "minimum": 2, "maximum": 10}
        },
        "required": ["file_path", "feature_columns", "n_clusters"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import pandas as pd
            from sklearn.cluster import KMeans
            
            df = pd.read_csv(args.get("file_path"))
            X = df[args.get("feature_columns")]
            
            kmeans = KMeans(n_clusters=args.get("n_clusters"), random_state=42)
            clusters = kmeans.fit_predict(X)
            
            output = f"K-Means Kümeleme:\n\nKüme sayısı: {args.get('n_clusters')}\nInertia: {kmeans.inertia_:.2f}\n\nKüme dağılımı:\n{pd.Series(clusters).value_counts().sort_index()}"
            return ToolResult(ok=True, output=output, data={"inertia": kmeans.inertia_, "cluster_centers": kmeans.cluster_centers_.tolist()})
        except ImportError:
            return ToolResult(ok=False, error="scikit-learn yüklü değil")
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class CorrelationAnalysisTool(BaseTool):
    """Korelasyon analizi."""
    name = "correlation_analysis"
    description = "Değişkenler arası korelasyon hesaplar."
    permission: PermissionKey = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {"type": "string"},
            "method": {"type": "string", "enum": ["pearson", "spearman"], "description": "Korelasyon metodu"}
        },
        "required": ["file_path"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import pandas as pd
            df = pd.read_csv(args.get("file_path"))
            method = args.get("method", "pearson")
            corr = df.corr(method=method)
            output = f"Korelasyon Matrisi ({method}):\n\n{corr}"
            return ToolResult(ok=True, output=output, data={"correlation_matrix": corr.to_dict()})
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class TimeSeriesForecastTool(BaseTool):
    """Zaman serisi tahmini."""
    name = "time_series_forecast"
    description = "Basit zaman serisi tahmini yapar."
    permission: PermissionKey = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {"type": "string"},
            "date_column": {"type": "string"},
            "value_column": {"type": "string"},
            "periods": {"type": "integer", "description": "Tahmin periyodu"}
        },
        "required": ["file_path", "date_column", "value_column", "periods"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import pandas as pd
            df = pd.read_csv(args.get("file_path"))
            df[args.get("date_column")] = pd.to_datetime(df[args.get("date_column")])
            
            # Basit moving average tahmini
            window = min(7, len(df) // 2)
            ma = df[args.get("value_column")].rolling(window=window).mean().iloc[-1]
            
            output = f"Zaman Serisi Tahmini:\n\nSon {window} periyot ortalaması: {ma:.2f}\n\n⚠️ Gelişmiş tahmin için Prophet veya ARIMA kullanın."
            return ToolResult(ok=True, output=output, data={"moving_average": ma, "window": window})
        except Exception as e:
            return ToolResult(ok=False, error=str(e))
